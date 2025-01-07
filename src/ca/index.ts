import { CAServer } from './server';

import dotenv from 'dotenv';

dotenv.config();

const port = process.env.CA_PORT;
if (!port) {
  throw new Error('CA_PORT is not defined in the .env file');
}

const caCertPath = process.env.CA_CERT_PATH;
if (!caCertPath) {
  throw new Error('CA_CERT_PATH is not defined in the .env file');
}

const server = new CAServer(parseInt(port), caCertPath);
server.start();
