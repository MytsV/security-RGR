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
  ServerFinishedMessage,
  ClientFinishedMessage,
  ClientFinishedMessageSchema,
  ServerFinishedMessageSchema,
  ServerDataMessage,
  ClientDataMessage,
  ServerDataMessageSchema,
  ClientDataMessageSchema,
} from './types';
import { z } from 'zod';
import {
  decryptMessage,
  deriveSessionKey,
  encryptMessage,
  generateVerifyData,
  parseMessage,
  stringifyMessage,
} from './utils';
import net from 'net';
import {
  sendServerHelloMessage,
  fetchValidity,
  sendPremaster,
  sendServerPremasterConfirmation,
  startClientInputTransfer, sendClientFinished, sendServerFinished,
} from './message-sending';
import crypto from 'crypto';

type MessageHandling = (message: any, connectionDetails: ConnectionDetails, socket: net.Socket) => void;

const handleClientHello: MessageHandling = (message: ClientHelloMessage, connectionDetails, socket) => {
  console.log('Received client hello message.');
  console.log(`Client random: ${message.random}`);

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
  console.log(`Server random: ${message.random}`);
  console.log(`Server certificate: ${message.certificate}`);

  connectionDetails.serverRandom = message.random;
  connectionDetails.serverCertificate = message.certificate;

  const isValid = await fetchValidity(message.certificate);
  if (!isValid) {
    throw Error('Server certificate is invalid.');
  }
  console.log('Approved the certificate validity at certificate authority.');

  sendPremaster(socket, connectionDetails);
};

const handleClientPremaster: MessageHandling = (message: ClientPremasterMessage, connectionDetails, socket) => {
  if (connectionDetails.serverKey === undefined) {
    throw Error('Server key is not set.');
  }

  console.log(`Received encrypted premaster: ${message.encryptedPremaster}`);

  connectionDetails.premaster = crypto
    .privateDecrypt(
      {
        key: crypto.createPrivateKey(connectionDetails.serverKey),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(message.encryptedPremaster, 'hex'),
    )
    .toString('hex');

  console.log(`Decrypted premaster: ${connectionDetails.premaster}`);

  sendServerPremasterConfirmation(socket);
};

const handleServerPremaster: MessageHandling = (message: ServerPremasterMessage, connectionDetails, socket) => {
  console.log('Received confirmation of server decrypting premaster.');
  connectionDetails.sessionKey = deriveSessionKey(connectionDetails);
  sendClientFinished(socket, connectionDetails);
};

const handleServerFinished: MessageHandling = (
  message: ServerFinishedMessage,
  connectionDetails: ConnectionDetails,
  socket: net.Socket,
) => {
  console.log(`Received server finished message: ${message.verifyData}`);
  const expectedVerifyData = generateVerifyData(connectionDetails, false);
  if (message.verifyData !== expectedVerifyData) {
    throw new Error('Finished message verification failed.');
  }
  console.log('Server finished message is valid.');
  startClientInputTransfer(socket, connectionDetails);
};

const handleClientFinished: MessageHandling = (
  message: ClientFinishedMessage,
  connectionDetails: ConnectionDetails,
  socket: net.Socket,
) => {
  console.log(`Received client finished message: ${message.verifyData}`);
  connectionDetails.sessionKey = deriveSessionKey(connectionDetails);

  const expectedVerifyData = generateVerifyData(connectionDetails, true);
  if (message.verifyData !== expectedVerifyData) {
    throw new Error('Client finished message verification failed.');
  }
  console.log('Client finished message is valid.');
  sendServerFinished(socket, connectionDetails);
};

const handleServerData: MessageHandling = (message: ServerDataMessage, connectionDetails: ConnectionDetails) => {
  const decrypted = decryptMessage(message.encryptedData, connectionDetails.sessionKey!);
  console.log('Received from server:', decrypted);
};

const handleClientData: MessageHandling = (
  message: ClientDataMessage,
  connectionDetails: ConnectionDetails,
  socket: net.Socket,
) => {
  const decrypted = decryptMessage(message.encryptedData, connectionDetails.sessionKey!);
  console.log('Received from client:', decrypted);

  const response = `Accepted ${decrypted}`;

  const serverData: ServerDataMessage = {
    type: MessageType.ServerData,
    encryptedData: encryptMessage(response, connectionDetails.sessionKey!),
  };

  socket.write(stringifyMessage(serverData));
};

const serverHandlers: Record<string, MessageHandling> = {
  [MessageType.ClientHello]: handleClientHello,
  [MessageType.ClientPremaster]: handleClientPremaster,
  [MessageType.ClientFinished]: handleClientFinished,
  [MessageType.ClientData]: handleClientData,
};

const clientHandlers: Record<string, MessageHandling> = {
  [MessageType.ServerHello]: handleServerHello,
  [MessageType.ServerPremaster]: handleServerPremaster,
  [MessageType.ServerFinished]: handleServerFinished,
  [MessageType.ServerData]: handleServerData,
};

const messageSchemas: Record<string, z.Schema> = {
  [MessageType.ClientHello]: ClientHelloMessageSchema,
  [MessageType.ServerHello]: ServerHelloMessageSchema,
  [MessageType.ClientPremaster]: ClientPremasterMessageSchema,
  [MessageType.ServerPremaster]: ServerPremasterMessageSchema,
  [MessageType.ClientFinished]: ClientFinishedMessageSchema,
  [MessageType.ServerFinished]: ServerFinishedMessageSchema,
  [MessageType.ClientData]: ClientDataMessageSchema,
  [MessageType.ServerData]: ServerDataMessageSchema,
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
