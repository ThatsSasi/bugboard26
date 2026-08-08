import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

// Definizione base dell'API
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BugBoard26 API',
      version: '1.0.0',
      description: 'Documentazione interattiva per il backend RESTful di BugBoard26.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Server di Sviluppo',
      },
    ],
    // Configurazione per l'autenticazione JWT in Swagger
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Percorsi in cui Swagger andrà a cercare i commenti per autogenerare i documenti
  apis: ['./src/routes/*.ts'], 
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('📄 Swagger UI disponibile su http://localhost:3000/api-docs');
};