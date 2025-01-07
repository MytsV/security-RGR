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
  ClientData = 'client_data',
  ServerData = 'server_data',
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

const ClientFinishedMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.ClientFinished),
  verifyData: z.string(),
});

const ServerFinishedMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.ServerFinished),
  verifyData: z.string(),
});

const ClientDataMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.ClientData),
  encryptedData: z.string(),
});

const ServerDataMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.ServerData),
  encryptedData: z.string(),
});

export {
  BaseMessageSchema,
  ClientHelloMessageSchema,
  ServerHelloMessageSchema,
  ClientPremasterMessageSchema,
  ServerPremasterMessageSchema,
  ClientFinishedMessageSchema,
  ServerFinishedMessageSchema,
  ClientDataMessageSchema,
  ServerDataMessageSchema,
};

type BaseMessage = z.infer<typeof BaseMessageSchema>;
type ClientHelloMessage = z.infer<typeof ClientHelloMessageSchema>;
type ServerHelloMessage = z.infer<typeof ServerHelloMessageSchema>;
type ClientPremasterMessage = z.infer<typeof ClientPremasterMessageSchema>;
type ServerPremasterMessage = z.infer<typeof ServerPremasterMessageSchema>;
type ClientFinishedMessage = z.infer<typeof ClientFinishedMessageSchema>;
type ServerFinishedMessage = z.infer<typeof ServerFinishedMessageSchema>;
type ClientDataMessage = z.infer<typeof ClientDataMessageSchema>;
type ServerDataMessage = z.infer<typeof ServerDataMessageSchema>;

export {
  BaseMessage,
  ClientHelloMessage,
  ServerHelloMessage,
  ClientPremasterMessage,
  ServerPremasterMessage,
  ClientFinishedMessage,
  ServerFinishedMessage,
  ClientDataMessage,
  ServerDataMessage,
};

export type ConnectionDetails = {
  clientRandom?: string;
  serverRandom?: string;
  serverCertificate?: string;
  serverKey?: string;
  premaster?: string;
  sessionKey?: string;
};
