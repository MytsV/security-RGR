import {
  ClientDataMessage,
  ClientFinishedMessage,
  ClientHelloMessage,
  ClientPremasterMessage,
  ConnectionDetails,
  MessageType,
  ServerFinishedMessage,
  ServerHelloMessage,
  ServerPremasterMessage,
} from './types';
import {
  encryptMessage,
  generateRandomNonce,
  generateVerifyData,
  loadServerCertificate,
  loadServerKey,
  stringifyMessage,
} from './utils';
import net from 'net';
import crypto from 'crypto';
import readline from 'readline';

export const sendClientHelloMessage = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  console.log('Sending client hello message.');
  const message: ClientHelloMessage = {
    type: MessageType.ClientHello,
    random: generateRandomNonce(),
  };
  connectionDetails.clientRandom = message.random;
  console.log(`Client random: ${message.random}`);
  socket.write(stringifyMessage(message));
};

export const sendServerHelloMessage = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  console.log('Sending server hello message.');

  const message: ServerHelloMessage = {
    type: MessageType.ServerHello,
    random: generateRandomNonce(),
    certificate: loadServerCertificate(),
  };

  console.log(`Server random: ${message.random}`);
  console.log(`Server certificate: ${message.certificate}`);

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
  console.log('Validating the server certificate.');

  const port = process.env.CA_PORT;
  if (!port) {
    throw new Error('CA_PORT is not defined in the .env file');
  }

  const client = net.createConnection({ port: parseInt(port) }, () => {
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

export const sendPremaster = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  if (connectionDetails.serverCertificate === undefined) {
    throw Error('Server certificate is not set.');
  }

  const randomBytes = crypto.randomBytes(48);
  connectionDetails.premaster = randomBytes.toString('hex');

  console.log(`Generated premaster ${connectionDetails.premaster}`);

  const cert = new crypto.X509Certificate(connectionDetails.serverCertificate);
  const publicKey = cert.publicKey;

  const encryptedPremaster = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    randomBytes,
  );

  const message: ClientPremasterMessage = {
    type: MessageType.ClientPremaster,
    encryptedPremaster: encryptedPremaster.toString('hex'),
  };

  console.log(`Sending encrypted premaster: ${message.encryptedPremaster}.`);

  socket.write(stringifyMessage(message));
};

export const sendServerPremasterConfirmation = (socket: net.Socket) => {
  const message: ServerPremasterMessage = {
    type: MessageType.ServerPremaster,
  };
  console.log('Sending confirmation of server decrypting premaster.');
  socket.write(stringifyMessage(message));
};

export const sendClientFinished = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  const message: ClientFinishedMessage = {
    type: MessageType.ClientFinished,
    verifyData: generateVerifyData(connectionDetails, true),
  };
  console.log(`Sending client finished message with verify data: ${message.verifyData}`);
  socket.write(stringifyMessage(message));
};

export const sendServerFinished = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  const message: ServerFinishedMessage = {
    type: MessageType.ServerFinished,
    verifyData: generateVerifyData(connectionDetails, false),
  };
  console.log(`Sending server finished message with verify data: ${message.verifyData}`);
  socket.write(stringifyMessage(message));
};

export const startClientInputTransfer = (socket: net.Socket, connectionDetails: ConnectionDetails) => {
  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Input the message: ',
  });

  reader.prompt();

  reader.on('line', (input: string) => {
    const clientData: ClientDataMessage = {
      type: MessageType.ClientData,
      encryptedData: encryptMessage(input, connectionDetails.sessionKey!),
    };
    socket.write(stringifyMessage(clientData));
  });
};
