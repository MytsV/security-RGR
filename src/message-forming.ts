import { ClientHelloMessage, MessageType } from './types';
import { generateRandomNonce } from './utils';

export const formClientHelloMessage = (): ClientHelloMessage => {
  return {
    type: MessageType.ClientHello,
    random: generateRandomNonce(),
  };
};
