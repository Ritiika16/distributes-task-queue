import { z } from 'zod';

const emailSchema = z.object({
  type: z.literal('email'),
  recipient: z
    .string()
    .min(1, 'Recipient is required')
    .email('Recipient must be a valid email address'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(500, 'Subject must not exceed 500 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must not exceed 5000 characters'),
});

const smsSchema = z.object({
  type: z.literal('sms'),
  recipient: z
    .string()
    .regex(/^\+\d+$/, 'Recipient must be a valid international phone number starting with +'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(500, 'Subject must not exceed 500 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must not exceed 5000 characters'),
});

const pushSchema = z.object({
  type: z.literal('push'),
  recipient: z.string().min(1, 'Recipient is required'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(500, 'Subject must not exceed 500 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must not exceed 5000 characters'),
});

export const notificationSchema = z.discriminatedUnion('type', [
  emailSchema,
  smsSchema,
  pushSchema,
]);

export type NotificationInput = z.infer<typeof notificationSchema>;
