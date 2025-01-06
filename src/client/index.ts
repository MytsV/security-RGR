import net from 'net';
import { sendClientHelloMessage } from '../common/message-sending';
import { ConnectionDetails } from '../common/types';
import { handleClientMessage } from '../common/message-handling';

let connectionDetails: ConnectionDetails = {};

const index = net.createConnection({ port: 8080 }, () => {
  console.log('Connected to the server.');
  sendClientHelloMessage(index, connectionDetails);
});

index.on('data', (data) => {
  try {
    handleClientMessage(data.toString(), connectionDetails, index);
  } catch (error) {
    console.error('Error processing server message:', error);
  }
  console.log(connectionDetails);
});

index.on('end', () => {
  connectionDetails = {};
  console.log('Disconnected from the server.');
});

index.on('error', (err) => {
  console.error('Connection error:', err);
});
