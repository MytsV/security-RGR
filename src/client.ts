import * as net from 'net';
import { handleClientMessage } from './message-handling';
import { ConnectionDetails } from './types';
import { sendClientHelloMessage } from './message-sending';

let connectionDetails: ConnectionDetails = {};

const client = net.createConnection({ port: 8080 }, () => {
  console.log('Connected to the server.');
  sendClientHelloMessage(client, connectionDetails);
});

client.on('data', (data) => {
  try {
    handleClientMessage(data.toString(), connectionDetails, client);
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
