import {
  BaseMessageSchema,
  ClientHelloMessageSchema,
  ServerHelloMessageSchema,
  ClientHelloMessage,
  ServerHelloMessage,
  ConnectionDetails,
  MessageType,
} from './types';
import { z } from 'zod';
import { parseMessage } from './utils';
import * as net from 'net';
import { sendServerHelloMessage } from './message-sending';

type MessageHandling = (message: any, connectionDetails: ConnectionDetails, socket: net.Socket) => void;

const handleClientHello: MessageHandling = (message: ClientHelloMessage, connectionDetails, socket) => {
  connectionDetails.serverRandom = undefined;
  connectionDetails.premaster = undefined;
  connectionDetails.sessionKey = undefined;
  connectionDetails.clientRandom = message.random;
  sendServerHelloMessage(socket, connectionDetails);
};

const handleServerHello: MessageHandling = (message: ServerHelloMessage, connectionDetails) => {
  if (connectionDetails.clientRandom === undefined) {
    console.error('Have not sent a client hello message yet.');
  }
  connectionDetails.serverRandom = message.random;
};

const serverHandlers: Record<string, MessageHandling> = {
  [MessageType.ClientHello]: handleClientHello,
};

const clientHandlers: Record<string, MessageHandling> = {
  [MessageType.ServerHello]: handleServerHello,
};

const messageSchemas: Record<string, z.Schema> = {
  [MessageType.ClientHello]: ClientHelloMessageSchema,
  [MessageType.ServerHello]: ServerHelloMessageSchema,
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
