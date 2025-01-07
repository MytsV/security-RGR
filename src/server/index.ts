import net from 'net';
import { ConnectionDetails } from '../common/types';
import { handleServerMessage } from '../common/message-handling';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.SERVER_PORT;
if (!port) {
  throw new Error('SERVER_PORT is not defined in the .env file');
}

const server = net.createServer((socket) => {
  const connectionDetails: ConnectionDetails = {};

  socket.on('data', (data) => {
    handleServerMessage(data.toString(), connectionDetails, socket);
  });

  socket.on('end', () => {
    console.log('Client disconnected.');
  });
});

server.listen(parseInt(port), () => {
  console.log('TCP server is running on port 8080.');
});
