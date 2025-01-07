import crypto, { randomBytes } from 'crypto';
import { BaseMessage, ConnectionDetails, MessageType } from './types';
import fs from 'fs';

export const generateRandomNonce = (): string => {
  return randomBytes(32).toString('hex');
};

export const loadServerCertificate = (): string => {
  const serverCertPath = process.env.SERVER_CERT_PATH;
  if (!serverCertPath) {
    throw new Error('SERVER_CERT_PATH is not defined in the .env file');
  }
  return fs.readFileSync(serverCertPath, 'utf-8');
};

export const loadServerKey = (): string => {
  const serverKeyPath = process.env.SERVER_KEY_PATH;
  if (!serverKeyPath) {
    throw new Error('SERVER_KEY_PATH is not defined in the .env file');
  }
  return fs.readFileSync(serverKeyPath, 'utf-8');
};

export const stringifyMessage = (message: BaseMessage): string => JSON.stringify(message);
export const parseMessage = (rawMessage: string): BaseMessage => JSON.parse(rawMessage);

export const deriveSessionKey = (connectionDetails: ConnectionDetails): string => {
  const premaster = Buffer.from(connectionDetails.premaster!, 'hex');
  const clientRandom = Buffer.from(connectionDetails.clientRandom!, 'hex');
  const serverRandom = Buffer.from(connectionDetails.serverRandom!, 'hex');

  const hmac1 = crypto.createHmac('sha256', premaster);
  hmac1.update(Buffer.concat([clientRandom, serverRandom]));
  const masterSecret = hmac1.digest();

  const hmac2 = crypto.createHmac('sha256', masterSecret);
  hmac2.update(Buffer.concat([serverRandom, clientRandom]));
  return hmac2.digest('hex');
};

const deriveFinishedKey = (connectionDetails: ConnectionDetails, isClient: boolean): Buffer => {
  const sessionKey = Buffer.from(connectionDetails.sessionKey!, 'hex');
  const label: string = isClient ? MessageType.ClientFinished : MessageType.ServerFinished;

  const hmac = crypto.createHmac('sha256', sessionKey);
  hmac.update(Buffer.from(label));
  return hmac.digest();
};

export const generateVerifyData = (connectionDetails: ConnectionDetails, isClient: boolean): string => {
  const finishedKey = deriveFinishedKey(connectionDetails, isClient);

  const transcript = crypto.createHash('sha256');
  transcript.update(connectionDetails.clientRandom!);
  transcript.update(connectionDetails.serverRandom!);
  transcript.update(connectionDetails.serverCertificate!);
  transcript.update(connectionDetails.premaster!);
  const transcriptHash = transcript.digest();

  const hmac = crypto.createHmac('sha256', finishedKey);
  hmac.update(transcriptHash);
  return hmac.digest('hex');
};

export const encryptMessage = (data: string, sessionKey: string): string => {
  const nonce = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(sessionKey, 'hex'), nonce);

  const encrypted = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()]);

  const authTag = cipher.getAuthTag();
  const complete = Buffer.concat([nonce, authTag, encrypted]);

  return complete.toString('hex');
};

export const decryptMessage = (encryptedHex: string, sessionKey: string): string => {
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const nonce = encrypted.subarray(0, 12);
  const authTag = encrypted.subarray(12, 28);
  const data = encrypted.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(sessionKey, 'hex'), nonce);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString();
};
