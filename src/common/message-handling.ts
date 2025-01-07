import {
  BaseMessageSchema,
  ClientHelloMessageSchema,
  ServerHelloMessageSchema,
  ClientHelloMessage,
  ServerHelloMessage,
  ConnectionDetails,
  MessageType,
  ClientPremasterMessageSchema,
  ClientPremasterMessage,
  ServerPremasterMessage,
  ServerPremasterMessageSchema,
} from './types';
import { z } from 'zod';
import { parseMessage } from './utils';
import net from 'net';
import {
  sendServerHelloMessage,
  fetchValidity,
  sendPremaster,
  sendServerPremasterConfirmation,
} from './message-sending';
import crypto from 'crypto';

type MessageHandling = (message: any, connectionDetails: ConnectionDetails, socket: net.Socket) => void;

const handleClientHello: MessageHandling = (message: ClientHelloMessage, connectionDetails, socket) => {
  console.log('Received client hello message.');
  connectionDetails.serverRandom = undefined;
  connectionDetails.premaster = undefined;
  connectionDetails.sessionKey = undefined;
  connectionDetails.clientRandom = message.random;
  sendServerHelloMessage(socket, connectionDetails);
};

const handleServerHello: MessageHandling = async (message: ServerHelloMessage, connectionDetails, socket) => {
  if (connectionDetails.clientRandom === undefined) {
    throw Error('Have not sent a client hello message yet.');
  }
  console.log('Received server hello message.');
  connectionDetails.serverRandom = message.random;
  connectionDetails.serverCertificate = message.certificate;
  const isValid = await fetchValidity(message.certificate);
  if (!isValid) {
    throw Error('Server certificate is invalid.');
  }
  console.log('Server certificate is valid.');
  sendPremaster(socket, connectionDetails);
};

const handleClientPremaster: MessageHandling = (message: ClientPremasterMessage, connectionDetails, socket) => {
  if (connectionDetails.serverKey === undefined) {
    throw Error('Server key is not set.');
  }

  connectionDetails.premaster = crypto
    .privateDecrypt(
      {
        key: crypto.createPrivateKey(connectionDetails.serverKey),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(message.encryptedPremaster, 'hex'),
    )
    .toString('hex');

  sendServerPremasterConfirmation(socket);
};

const handleServerPremaster: MessageHandling = (message: ServerPremasterMessage, connectionDetails, socket) => {
  console.log('Received confirmation of server decrypting premaster.');
};

const serverHandlers: Record<string, MessageHandling> = {
  [MessageType.ClientHello]: handleClientHello,
  [MessageType.ClientPremaster]: handleClientPremaster,
};

const clientHandlers: Record<string, MessageHandling> = {
  [MessageType.ServerHello]: handleServerHello,
  [MessageType.ServerPremaster]: handleServerPremaster,
};

const messageSchemas: Record<string, z.Schema> = {
  [MessageType.ClientHello]: ClientHelloMessageSchema,
  [MessageType.ServerHello]: ServerHelloMessageSchema,
  [MessageType.ClientPremaster]: ClientPremasterMessageSchema,
  [MessageType.ServerPremaster]: ServerPremasterMessageSchema,
};

const handleMessage = (
  rawMessage: string,
  connectionDetails: ConnectionDetails,
  socket: net.Socket,
  handlers: Record<string, MessageHandling>,
) => {
  try {
    const parsedMessage = parseMessage(rawMessage);

    const baseMessage = BaseMessageSchema.parse(parsedMessage);

    const serverHandler = handlers[baseMessage.type];
    if (serverHandler === undefined) {
      console.error('Cannot handle the message of type', baseMessage.type);
      return;
    }

    const messageSchema = messageSchemas[baseMessage.type];
    const validatedMessage = messageSchema.parse(parsedMessage);
    serverHandler(validatedMessage, connectionDetails, socket);
  } catch (error) {
    console.error('Failed to handle message:', error);
  }
};

export const handleServerMessage = (rawMessage: string, connectionDetails: ConnectionDetails, socket: net.Socket) => {
  handleMessage(rawMessage, connectionDetails, socket, serverHandlers);
};

export const handleClientMessage = (rawMessage: string, connectionDetails: ConnectionDetails, socket: net.Socket) => {
  handleMessage(rawMessage, connectionDetails, socket, clientHandlers);
};
