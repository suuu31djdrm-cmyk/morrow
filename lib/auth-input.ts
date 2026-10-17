import {z} from 'zod';
const credentials={identifier:z.email().max(254),password:z.string().min(1).max(128),captchaToken:z.string().max(4096).optional()};
export const loginSchema=z.object(credentials).strict();
export const signupSchema=z.object({...credentials,password:z.string().min(12).max(128).refine(value=>new TextEncoder().encode(value).length<=72)}).strict();
