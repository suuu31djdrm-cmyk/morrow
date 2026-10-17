import {z} from 'zod';
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/),time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),energy=z.enum(['high','medium','low']);
const plan=z.object({id:z.string().min(1).max(100),date,time:z.union([time,z.literal('')]),hours:z.number().positive().max(24),title:z.string().max(300),cat:z.string().max(50),energy,themeId:z.string().max(100).optional(),origin:z.enum(['suggestion','manual']).optional(),completed:z.boolean().optional()}).strict();
const theme=z.object({id:z.string().min(1).max(100),week:date,title:z.string().min(1).max(120),activity:z.string().min(1).max(300),hours:z.number().min(.5).max(40),priority:z.number().int().min(1).max(3),energy}).strict();
export const plannerStateSchema=z.object({plans:z.array(plan).max(5000),weekThemes:z.array(theme).max(500),availability:z.object({weekdayStart:time,weekdayEnd:time,weekendStart:time,weekendEnd:time,peak:z.enum(['morning','afternoon','evening'])}).strict()}).strict();
