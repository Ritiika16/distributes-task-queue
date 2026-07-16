import swaggerJsdoc from 'swagger-jsdoc';
import logger from '../logging/logger';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Distributed Task Queue API',
      version: '1.0.0',
      description: 'API for managing distributed notification jobs with BullMQ',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'Basic authentication for Bull Board dashboard',
        },
      },
      schemas: {
        NotificationRequest: {
          type: 'object',
          required: ['type', 'recipient', 'subject', 'message'],
          properties: {
            type: {
              type: 'string',
              enum: ['email', 'sms', 'push'],
              description: 'Type of notification',
              example: 'email',
            },
            recipient: {
              type: 'string',
              description: 'Recipient address (email for email type, phone for SMS, token for push)',
              example: 'user@example.com',
            },
            subject: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Subject of the notification',
              example: 'Welcome to our service',
            },
            message: {
              type: 'string',
              minLength: 1,
              maxLength: 5000,
              description: 'Message content',
              example: 'Thank you for signing up!',
            },
          },
        },
        NotificationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            duplicate: {
              type: 'boolean',
              description: 'True if this is a duplicate request (same idempotency key)',
              example: false,
            },
            jobId: {
              type: 'string',
              description: 'BullMQ job identifier',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            status: {
              type: 'string',
              enum: ['queued', 'already_exists'],
              description: 'Job status',
              example: 'queued',
            },
          },
        },
        MetricsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2026-07-16T13:48:00.000Z',
            },
            notifications: {
              type: 'object',
              properties: {
                waiting: {
                  type: 'integer',
                  example: 0,
                },
                active: {
                  type: 'integer',
                  example: 0,
                },
                completed: {
                  type: 'integer',
                  example: 24,
                },
                failed: {
                  type: 'integer',
                  example: 2,
                },
                delayed: {
                  type: 'integer',
                  example: 0,
                },
                paused: {
                  type: 'integer',
                  example: 0,
                },
              },
            },
            deadLetterQueue: {
              type: 'object',
              properties: {
                waiting: {
                  type: 'integer',
                  example: 2,
                },
                completed: {
                  type: 'integer',
                  example: 0,
                },
                failed: {
                  type: 'integer',
                  example: 0,
                },
              },
            },
            redis: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  example: 'ready',
                },
              },
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            service: {
              type: 'string',
              example: 'distributed-task-queue',
            },
            uptime: {
              type: 'integer',
              description: 'Server uptime in seconds',
              example: 3600,
            },
            redis: {
              type: 'string',
              enum: ['connected', 'disconnected', 'error'],
              example: 'connected',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2026-07-16T13:48:00.000Z',
            },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    example: 'recipient',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email',
                  },
                },
              },
            },
          },
        },
        InternalServerErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Internal server error',
            },
            message: {
              type: 'string',
              example: 'Failed to create notification job',
            },
          },
        },
      },
      headers: {
        IdempotencyKey: {
          name: 'Idempotency-Key',
          description: 'Optional header for idempotency. Requests using the same key within 24 hours return the existing job instead of creating a duplicate.',
          schema: {
            type: 'string',
          },
          example: 'welcome-email-001',
        },
      },
    },
  },
  apis: ['./src/api/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

logger.info('Swagger initialized');
