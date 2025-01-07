import { z } from 'zod';

export enum RequestType {
  Validation = 'validation',
}

const BaseRequestSchema = z.object({
  type: z.string(),
  requestId: z.string(),
});

const ValidationRequestSchema = BaseRequestSchema.extend({
  type: z.literal(RequestType.Validation),
  certificate: z.string(),
});

const ValidationResponseSchema = z.object({
  type: z.literal(RequestType.Validation),
  isValid: z.boolean(),
});


type BaseRequest = z.infer<typeof BaseRequestSchema>;
type ValidationRequest = z.infer<typeof ValidationRequestSchema>;
type ValidationResponse = z.infer<typeof ValidationResponseSchema>;

export {
  BaseRequestSchema,
  ValidationRequestSchema,
  ValidationResponseSchema,
  BaseRequest,
  ValidationRequest,
  ValidationResponse,
};
