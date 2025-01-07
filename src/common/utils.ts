import crypto, { randomBytes } from 'crypto';
import { BaseMessage, ConnectionDetails, MessageType } from './types';

export const generateRandomNonce = (): string => {
  return randomBytes(32).toString('hex');
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
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(sessionKey, 'hex'), iv);

  const encrypted = Buffer.concat([iv, cipher.update(Buffer.from(data)), cipher.final()]);

  return encrypted.toString('hex');
};

export const decryptMessage = (encryptedHex: string, sessionKey: string): string => {
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const iv = encrypted.subarray(0, 16);
  const data = encrypted.subarray(16);

  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(sessionKey, 'hex'), iv);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString();
};
