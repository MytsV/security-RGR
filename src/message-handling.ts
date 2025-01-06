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

type MessageHandling = (message: any, connectionDetails: ConnectionDetails) => void;

const handleClientHello: MessageHandling = (message: ClientHelloMessage, connectionDetails) => {
  connectionDetails.serverRandom = undefined;
  connectionDetails.premaster = undefined;
  connectionDetails.sessionKey = undefined;
  connectionDetails.clientRandom = message.random;
};

const handleServerHello: MessageHandling = (message: ServerHelloMessage, connectionDetails) => {
  if (connectionDetails.clientRandom === undefined) {
    console.error('Cannot handle server_hello message without client_random');
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
    serverHandler(validatedMessage, connectionDetails);
  } catch (error) {
    console.error('Failed to handle message:', error);
  }
};

export const handleServerMessage = (rawMessage: string, connectionDetails: ConnectionDetails) => {
  handleMessage(rawMessage, connectionDetails, serverHandlers);
};

export const handleClientMessage = (rawMessage: string, connectionDetails: ConnectionDetails) => {
  handleMessage(rawMessage, connectionDetails, clientHandlers);
};
