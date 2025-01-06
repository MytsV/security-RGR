import * as net from 'net';
import { ConnectionDetails } from '../common/types';
import { handleServerMessage } from '../common/message-handling';

const index = net.createServer((socket) => {
  const connectionDetails: ConnectionDetails = {};

  socket.on('data', (data) => {
    handleServerMessage(data.toString(), connectionDetails, socket);
  });

  socket.on('end', () => {
    console.log('Client disconnected.');
  });
});

index.listen(8080, () => {
  console.log('TCP server is running on port 8080.');
});
