import { z } from 'zod';

const BaseMessageSchema = z.object({
  type: z.string(),
});

export enum MessageType {
  ClientHello = 'client_hello',
  ServerHello = 'server_hello',
  ClientPremaster = 'client_premaster',
  ServerPremaster = 'server_premaster',
  ClientFinished = 'client_finished',
  ServerFinished = 'server_finished',
}

const ClientHelloMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.ClientHello),
  random: z.string(),
});

const ServerHelloMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.ServerHello),
  random: z.string(),
  certificate: z.string(),
});

const ClientPremasterMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.ClientPremaster),
  encryptedPremaster: z.string(),
});

const ServerPremasterMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.ServerPremaster),
});

export {
  BaseMessageSchema,
  ClientHelloMessageSchema,
  ServerHelloMessageSchema,
  ClientPremasterMessageSchema,
  ServerPremasterMessageSchema,
};

type BaseMessage = z.infer<typeof BaseMessageSchema>;
type ClientHelloMessage = z.infer<typeof ClientHelloMessageSchema>;
type ServerHelloMessage = z.infer<typeof ServerHelloMessageSchema>;
type ClientPremasterMessage = z.infer<typeof ClientPremasterMessageSchema>;
type ServerPremasterMessage = z.infer<typeof ServerPremasterMessageSchema>;

export { BaseMessage, ClientHelloMessage, ServerHelloMessage, ClientPremasterMessage, ServerPremasterMessage };

export type ConnectionDetails = {
  clientRandom?: string;
  serverRandom?: string;
  serverCertificate?: string;
  serverKey?: string;
  premaster?: string;
  sessionKey?: string;
};
