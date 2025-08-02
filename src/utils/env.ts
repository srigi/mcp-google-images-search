import { z } from 'zod';

const envSchema = z.object({
  API_KEY: z.string().min(1, 'API_KEY environment variable is required'),
  SEARCH_ENGINE_ID: z.string().min(1, 'SEARCH_ENGINE_ID environment variable is required'),
});

export const env = envSchema.parse(process.env);
