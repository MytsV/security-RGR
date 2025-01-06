import { z } from 'zod';

export enum RequestType {
  Validation = 'validation',
  Generation = 'generation',
}

const BaseRequestSchema = z.object({
  type: z.string(),
  requestId: z.string(),
});

const ValidationRequestSchema = BaseRequestSchema.extend({
  type: z.literal(RequestType.Validation),
  certificate: z.string(),
});

const GenerationRequestSchema = BaseRequestSchema.extend({
  type: z.literal(RequestType.Generation),
  subject: z.string(),
  publicKey: z.string(),
});

const ValidationResponseSchema = z.object({
  type: z.literal(RequestType.Validation),
  isValid: z.boolean(),
});

const GenerationResponseSchema = z.object({
  type: z.literal(RequestType.Generation),
  certificate: z.string(),
});

type BaseRequest = z.infer<typeof BaseRequestSchema>;
type ValidationRequest = z.infer<typeof ValidationRequestSchema>;
type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
type ValidationResponse = z.infer<typeof ValidationResponseSchema>;
type GenerationResponse = z.infer<typeof GenerationResponseSchema>;

export {
  BaseRequestSchema,
  ValidationRequestSchema,
  GenerationRequestSchema,
  ValidationResponseSchema,
  GenerationResponseSchema,
  BaseRequest,
  ValidationRequest,
  GenerationRequest,
  ValidationResponse,
  GenerationResponse,
};
