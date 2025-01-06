import * as net from 'net';
import { handleClientMessage } from './message-handling';
import { ClientHelloMessage, ConnectionDetails } from './types';
import { stringifyMessage } from './utils';
import { formClientHelloMessage } from './message-forming';

let connectionDetails: ConnectionDetails = {};

const client = net.createConnection({ port: 8080 }, () => {
  console.log('Connected to the server.');

  const helloMessage: ClientHelloMessage = formClientHelloMessage();
  connectionDetails.clientRandom = helloMessage.random;
  client.write(stringifyMessage(helloMessage));
});

client.on('data', (data) => {
  try {
    handleClientMessage(data.toString(), connectionDetails);
  } catch (error) {
    console.error('Error processing server message:', error);
  }
  console.log(connectionDetails);
});

client.on('end', () => {
  connectionDetails = {};
  console.log('Disconnected from the server.');
});

client.on('error', (err) => {
  console.error('Connection error:', err);
});
