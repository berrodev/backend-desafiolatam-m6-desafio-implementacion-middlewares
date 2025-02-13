import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import 'dotenv/config';

const app = express();
// Configuración e inicio del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

/**
 * Configuración de Middleware
 * Establece la cadena de procesamiento de solicitudes
 */
// Habilita el parseado de JSON en el cuerpo de las peticiones
app.use(express.json());
// Configura el procesamiento de cookies
app.use(cookieParser());
// Configura el logging de solicitudes HTTP
app.use(morgan('dev'));
/**
 * Middleware de nivel de aplicación
 * Se ejecuta en cada solicitud que llega al servidor
 *
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función para pasar al siguiente middleware
 */
app.use((req, res, next) => {
  console.log('Middleware de nivel de aplicación ejecutado.');
  next();
});

/**
 * Middleware global de manejo de errores
 * Captura y procesa errores no manejados
 *
 * @param {Error} err - Objeto de error
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función para pasar al siguiente middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).send('Error del servidor.');
});

/**
 * Configuración del Router
 * Define rutas específicas y su middleware asociado
 */
const router = express.Router();

/**
 * Middleware de nivel de router
 * Se ejecuta solo para las rutas definidas en este router
 */
router.use((req, res, next) => {
  console.log('Middleware de nivel de direccionador ejecutado.');
  next();
});

/**
 * Estructuras de datos para el sistema de mensajería
 */
const messages = []; // Almacena los mensajes pendientes
const consumers = []; // Almacena los consumidores registrados

/**
 * Endpoint para enviar mensajes
 *
 * @route POST /send
 * @param {Object} req.body.message - Mensaje a enviar
 * @returns {Object} Estado del envío
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
 * Endpoint para recibir mensajes
 * Implementa patrón FIFO
 *
 * @route GET /receive
 * @returns {Object} Mensaje o respuesta vacía
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
 * Ruteo basado en contenido
 * Maneja diferentes tipos de respuesta según el parámetro type
 *
 * @route GET /api/route
 * @param {string} type - Tipo de respuesta solicitada (text/json)
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

// Monta el router en el path /api
app.use('/api', router);
