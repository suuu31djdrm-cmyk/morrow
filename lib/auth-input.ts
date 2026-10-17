import {z} from 'zod';
const identifier=z.email().max(254);
export const sendCodeSchema=z.object({intent:z.enum(['login','signup']),identifier,captchaToken:z.string().max(4096).optional()}).strict();
export const verifyCodeSchema=z.object({identifier,token:z.string().regex(/^\d{6,8}$/)}).strict();
