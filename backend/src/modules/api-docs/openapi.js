const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Bengal Beyond API',
    version: '1.0.0',
    description: 'Backend API documentation for Bengal Beyond. Authentication uses the existing bearer-token middleware.'
  },
  servers: [{ url: '/api', description: 'Current API base path' }],
  tags: [
    { name: 'Health' },
    { name: 'Authentication' },
    { name: 'Tours' },
    { name: 'Bookings' },
    { name: 'Customer Payments' },
    { name: 'Payment Webhooks' },
    { name: 'Admin' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object', properties: {
          success: { type: 'boolean', example: true },
          data: { nullable: true },
          meta: { type: 'object', nullable: true }
        }
      },
      ErrorEnvelope: {
        type: 'object', properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          requestId: { type: 'string' }
        }
      },
      Pagination: {
        type: 'object', properties: {
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1 },
          total: { type: 'integer' },
          totalPages: { type: 'integer' }
        }
      }
    },
    parameters: {
      Page: { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
      Limit: { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'], summary: 'Liveness check',
        responses: { 200: { description: 'API process is running' } }
      }
    },
    '/health/ready': {
      get: {
        tags: ['Health'], summary: 'Readiness and database check',
        responses: { 200: { description: 'API and database are ready' }, 503: { description: 'Database unavailable' } }
      }
    },
    '/webhooks/sslcommerz/ipn': {
      post: {
        tags: ['Payment Webhooks'], summary: 'SSLCommerz IPN receiver',
        description: 'Public gateway callback. The server must validate the transaction with SSLCommerz before changing payment state.',
        requestBody: { required: true, content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', properties: { val_id: { type: 'string' }, tran_id: { type: 'string' }, status: { type: 'string' } }, required: ['val_id'] } } } },
        responses: { 200: { description: 'Event accepted' }, 400: { description: 'Invalid callback' }, 502: { description: 'Validation service unavailable' } }
      }
    },
    '/customer/payments': {
      get: {
        tags: ['Customer Payments'], summary: 'List current customer payment attempts',
        security: [{ bearerAuth: [] }],
        parameters: [{ '$ref': '#/components/parameters/Page' }, { '$ref': '#/components/parameters/Limit' }],
        responses: { 200: { description: 'Payment list' }, 401: { description: 'Authentication required' } }
      }
    },
    '/customer/payments/{paymentId}': {
      get: {
        tags: ['Customer Payments'], summary: 'Get a customer-owned payment',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'paymentId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Payment details' }, 404: { description: 'Not found' } }
      }
    },
    '/customer/bookings/{bookingId}/payments': {
      post: {
        tags: ['Customer Payments'], summary: 'Create payment attempt and initiate checkout',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'bookingId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['idempotency_key'], properties: { idempotency_key: { type: 'string', maxLength: 100 } } } } } },
        responses: { 201: { description: 'Checkout initiated' }, 409: { description: 'Booking cannot be paid' } }
      }
    },
    '/admin/payment-webhooks/events': {
      get: {
        tags: ['Admin'], summary: 'List payment webhook events',
        security: [{ bearerAuth: [] }],
        parameters: [{ '$ref': '#/components/parameters/Page' }, { '$ref': '#/components/parameters/Limit' }, { name: 'status', in: 'query', schema: { type: 'string', enum: ['received','processing','processed','failed'] } }],
        responses: { 200: { description: 'Webhook event list' }, 403: { description: 'Insufficient permissions' } }
      }
    },
    '/admin/payment-webhooks/events/{eventId}/retry': {
      post: {
        tags: ['Admin'], summary: 'Retry a failed webhook event',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'eventId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Retry attempted' }, 409: { description: 'Event is not retryable' } }
      }
    }
  }
};
module.exports = openapi;
