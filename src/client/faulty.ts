import net from 'net';
import { ClientDataMessage, ConnectionDetails, MessageType } from '../common/types';
import { handleClientMessage } from '../common/message-handling';
import dotenv from 'dotenv';
import { stringifyMessage } from '../common/utils';

dotenv.config();

const port = process.env.SERVER_PORT;
if (!port) {
  throw new Error('SERVER_PORT is not defined in the .env file');
}

let connectionDetails: ConnectionDetails = {};

const client = net.createConnection({ port: parseInt(port) }, () => {
  console.log('Connected to the server.');
  const clientData: ClientDataMessage = {
    type: MessageType.ClientData,
    encryptedData: 'Hello!',
  };
  client.write(stringifyMessage(clientData));
});

client.on('data', (data) => {
  try {
    handleClientMessage(data.toString(), connectionDetails, client);
  } catch (error) {
    console.error('Error processing server message:', error);
  }
});

client.on('end', () => {
  connectionDetails = {};
  console.log('Disconnected from the server.');
});

client.on('error', (err) => {
  console.error('Connection error:', err);
});
