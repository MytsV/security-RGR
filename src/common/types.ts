import { z } from 'zod';

const BaseMessageSchema = z.object({
  type: z.string(),
});

export enum MessageType {
  ClientHello = 'client_hello',
  ServerHello = 'server_hello',
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

export { BaseMessageSchema, ClientHelloMessageSchema, ServerHelloMessageSchema };

type BaseMessage = z.infer<typeof BaseMessageSchema>;
type ClientHelloMessage = z.infer<typeof ClientHelloMessageSchema>;
type ServerHelloMessage = z.infer<typeof ServerHelloMessageSchema>;

export { BaseMessage, ClientHelloMessage, ServerHelloMessage };

export type ConnectionDetails = {
  clientRandom?: string;
  serverRandom?: string;
  serverCertificate?: string;
  serverKey?: string;
  premaster?: string;
  sessionKey?: string;
};
