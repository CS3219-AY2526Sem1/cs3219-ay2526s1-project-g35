const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'History Service API',
      version: '1.0.0',
      description:
        'API documentation for the PeerPrep History Service - tracks user question attempts and provides statistics',
      contact: {
        name: 'PeerPrep Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:8004',
        description: 'Development server',
      },
      {
        url: 'https://api.peerprep.com/history',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        History: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the history entry',
            },
            user_id: {
              type: 'string',
              description: 'User ID from the user service',
            },
            question_title: {
              type: 'string',
              description: 'Title of the question attempted',
            },
            difficulty: {
              type: 'string',
              enum: ['Easy', 'Medium', 'Hard'],
              description: 'Difficulty level of the question',
            },
            category: {
              type: 'string',
              description: 'Category/topic of the question',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the attempt was made',
            },
          },
        },
        HistoryInput: {
          type: 'object',
          required: ['user_id', 'question_title', 'difficulty', 'category'],
          properties: {
            user_id: {
              type: 'string',
              description: 'User ID from the user service',
            },
            question_title: {
              type: 'string',
              description: 'Title of the question attempted',
            },
            difficulty: {
              type: 'string',
              enum: ['Easy', 'Medium', 'Hard'],
              description: 'Difficulty level of the question',
            },
            category: {
              type: 'string',
              description: 'Category/topic of the question',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'History',
        description: 'History tracking endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin statistics endpoints (requires admin role)',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: ['./routes/*.js', './src/index.js'],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger documentation available at /api-docs');
}

module.exports = { setupSwagger, swaggerSpec };
