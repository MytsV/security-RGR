import * as net from 'net';
import { ConnectionDetails } from './types';
import { handleServerMessage } from './message-handling';

// Create a TCP server
const server = net.createServer((socket) => {
  const connectionDetails: ConnectionDetails = {};

  socket.on('data', (data) => {
    handleServerMessage(data.toString(), connectionDetails);
  });

  // Handle client disconnection
  socket.on('end', () => {
    console.log('Client disconnected.');
  });
});

// Start the server on port 8080
server.listen(8080, () => {
  console.log('TCP server is running on port 8080.');
});
