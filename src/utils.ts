import { randomBytes } from 'crypto';
import { BaseMessage } from './types';

export const generateRandomNonce = (): string => {
  return randomBytes(32).toString('hex');
};

export const stringifyMessage = (message: BaseMessage): string => JSON.stringify(message);
export const parseMessage = (rawMessage: string): BaseMessage => JSON.parse(rawMessage);
