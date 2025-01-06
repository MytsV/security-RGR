import { CAServer } from './server';

const server = new CAServer(8081, './ca');
server.start();
