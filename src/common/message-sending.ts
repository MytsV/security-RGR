import { ClientHelloMessage, ConnectionDetails, MessageType, ServerHelloMessage } from './types';
import { generateRandomNonce, stringifyMessage } from './utils';
import * as net from 'net';
import fs from 'fs';

export const sendClientHelloMessage = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  const message: ClientHelloMessage = {
    type: MessageType.ClientHello,
    random: generateRandomNonce(),
  };
  connectionDetails.clientRandom = message.random;
  socket.write(stringifyMessage(message));
};

const loadServerCertificate = (): string => {
  return fs.readFileSync('./ca/certs/server.crt', 'utf-8');
};

const loadServerKey = (): string => {
  return fs.readFileSync('./ca/private/server.key', 'utf-8');
};

export const sendServerHelloMessage = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  const message: ServerHelloMessage = {
    type: MessageType.ServerHello,
    random: generateRandomNonce(),
    certificate: loadServerCertificate(),
  };
  connectionDetails.serverRandom = message.random;
  connectionDetails.serverCertificate = message.certificate;
  connectionDetails.serverKey = loadServerKey();
  socket.write(stringifyMessage(message));
};

const executeValidityRequest = (certificate: string, resolve: (value: boolean) => void) => {
  const request = JSON.stringify({
    type: 'validation',
    certificate,
  });

  const client = new net.Socket();

  client.connect(8081, '127.0.0.1', () => {
    client.write(request);
  });

  client.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      client.end();
      resolve(response.isValid);
    } catch (error) {
      client.end();
      resolve(false);
    }
  });

  client.on('error', () => {
    client.end();
    resolve(false);
  });
};

export const fetchValidity = (certificate: string): Promise<boolean> => {
  return new Promise((resolve) => executeValidityRequest(certificate, resolve));
};
