import { z } from 'zod';

/**
 * Zod schema for validating notification job requests.
 * Ensures that all required fields are present and properly formatted.
 */
export const notificationSchema = z.object({
  type: z.enum(['email', 'sms', 'push'], {
    required_error: 'Notification type is required',
    invalid_type_error: 'Notification type must be one of: email, sms, push',
  }),
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

/**
 * Type inference from the notification schema.
 * Used for type-safe request handling.
 */
export type NotificationInput = z.infer<typeof notificationSchema>;
