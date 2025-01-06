import { ClientHelloMessage, ConnectionDetails, MessageType, ServerHelloMessage } from './types';
import { generateRandomNonce } from './utils';
import * as net from 'net';

export const sendClientHelloMessage = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  const message: ClientHelloMessage = {
    type: MessageType.ClientHello,
    random: generateRandomNonce(),
  };
  connectionDetails.clientRandom = message.random;
  socket.write(JSON.stringify(message));
};

export const sendServerHelloMessage = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  const message: ServerHelloMessage = {
    type: MessageType.ServerHello,
    random: generateRandomNonce(),
    publicKey: 'todo',
  };
  connectionDetails.serverRandom = message.random;
  socket.write(JSON.stringify(message));
};
