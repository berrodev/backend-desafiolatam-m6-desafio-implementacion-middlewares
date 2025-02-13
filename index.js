import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import 'dotenv/config';

const app = express();
// Server configuration and startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

/**
 * Middleware configuration
 * Sets up the request processing pipeline
 */
// Enable JSON parsing in request body
app.use(express.json());
// Configure cookie processing
app.use(cookieParser());

/**
 * Router configuration
 * Defines specific routes and their associated middleware
 */
const router = express.Router();

/* MIDDLEWARE TO STORE LOG MESSAGES */

// Setup logging using morgan
app.use(morgan('dev'));

// Create an array to store log messages
const logMessages = [];

/**
 * Router-level middleware to log messages skipping the /logs endpoint
 * @param {string} message - Log message
 */
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logMessages.push(message),
    },
    skip: (req) => req.path === '/logs',
  })
);

/**
 * Route to return log messages
 * @route GET /logs
 * @returns {Object} Log messages
 */
router.get('/logs', (req, res) => {
  res.json(logMessages);
});

let requestCount = 0;

/**
 * Application-level middleware
 * Executes on every request that reaches the server to count the number of requests
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Function to pass to the next middleware
 */
app.use((req, res, next) => {
  requestCount++;
  console.log(`Request count: ${requestCount}`);
  next();
});

/**
 * Router-level middleware
 * Executes only for the routes defined in this router
 */
router.use((req, res, next) => {
  console.log('Middleware de nivel de direccionador ejecutado.');
  next();
});

/**
 * Message system structure for message passing between producers and consumers
 */
const messages = []; // Stores messages sent by producers
const consumers = []; // Stores consumers subscribed to the message system

/**
 * Endpoint to send messages
 *
 * @route POST /send
 * @param {Object} req.body.message - Message to send
 * @returns {Object} Send status
 */
app.post('/send', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'El mensaje es requerido' });
  }
  messages.push({ header: 'Mensaje', body: message });
  console.log('Mensaje recibido:', message);
  res.status(200).json({ status: 'Mensaje enviado exitosamente' });
});

/**
 * Endpoint for consumers to receive messages
 * Consumers receive messages in the order they were sent (FIFO pattern)
 *
 * @route GET /receive
 * @returns {Object} Message or empty response
 */
app.get('/receive', (req, res) => {
  if (messages.length > 0) {
    const message = messages.shift();
    return res.status(200).json({ message });
  } else {
    return res.status(204).send();
  }
});

/**
 * Route-based routing
 * Handle different types of responses based on the type query parameter
 *
 * @route GET /api/route
 * @param {string} type -
 */
router.get('/route', (req, res) => {
  const { type } = req.query;
  if (type === 'text') {
    res.send('Mensaje de texto enviado.');
  } else if (type === 'json') {
    res.json({ message: 'Mensaje en formato JSON enviado.' });
  } else {
    res.status(400).send('Tipo de mensaje no soportado.');
  }
});

// Mount the router at the /api path
app.use('/api', router);

// Error handling for undefined routes
app.use((req, res, next) => {
  next(new Error('Ruta no encontrada.'));
});

/**
 * Global error handling middleware
 * Catches and processes unhandled errors
 *
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Function to pass to the next middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).send('Error del servidor.');
});
