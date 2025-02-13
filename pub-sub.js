// Importación de módulos necesarios
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import EventEmitter from 'events';

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

const pubSubChannel = new EventEmitter(); // Canal de mensajes para Pub-Sub
// Middleware incorporado para parsear el cuerpo de las solicitudes JSON
app.use(express.json());
// Middleware de terceros para manejo de cookies
app.use(cookieParser());
// Middleware de logging para depuración (Morgan)
app.use(morgan('dev'));

// Middleware de nivel de aplicación
app.use((req, res, next) => {
  console.log('Middleware de nivel de aplicación ejecutado.');
  next(); // Llama a la siguiente función middleware
});

// Middleware de nivel de direccionador
const router = express.Router();
router.use((req, res, next) => {
  console.log('Middleware de nivel de direccionador ejecutado.');
  next();
});

// Simulación de un sistema de mensajería (proveedores y consumidores)
const messages = [];
let subscribers = {}; // Suscriptores del sistema Pub-Sub por topicos

// Endpoint para que los productores envíen mensajes (Pub-Sub)
app.post('/publish', (req, res) => {
  const { message, topic = 'default' } = req.body; // topic opcional, default si no se especifica
  if (!message) {
    return res.status(400).json({ error: 'El mensaje es requerido' });
  }
  const messageObject = {
    header: 'Mensaje',
    body: message,
    topic: topic,
    timestamp: new Date(),
  };
  messages.push(messageObject);
  console.log(`Publicando mensaje en tópico ${topic}:`, message);
  // Emitir mensaje al tópico específico
  pubSubChannel.emit(`message:${topic}`, messageObject);
  res.status(200).json({
    status: 'Mensaje publicado correctamente',
    topic: topic,
  });
});

// Endpoint para que los consumidores reciban mensajes (Pub-Sub)
app.get('/subscribe/:topic', (req, res) => {
  const topic = req.params.topic || 'default';
  // Inicializar array de suscriptores para el tópico si no existe
  if (!subscribers[topic]) {
    subscribers[topic] = [];
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const sendMessage = (message) => {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  };
  subscribers[topic].push(sendMessage);
  // Suscribirse solo a eventos del tópico específico
  pubSubChannel.on(`message:${topic}`, sendMessage);
  // Manejo de desconexión
  req.on('close', () => {
    subscribers[topic] = subscribers[topic].filter(
      (sub) => sub !== sendMessage
    );
    pubSubChannel.removeListener(`message:${topic}`, sendMessage);
  });
});

// Endpoint para que los productores envíen mensajes (Point-to-Point)
app.post('/send', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'El mensaje es requerido' });
  }
  messages.push({ header: 'Mensaje', body: message });
  console.log('Mensaje recibido:', message);
  res.status(200).json({ status: 'Mensaje enviado exitosamente' });
});

// Endpoint para que los consumidores reciban mensajes (Point-to-Point)
app.get('/receive', (req, res) => {
  if (messages.length > 0) {
    const message = messages.shift(); // Elimina y obtiene el primer mensaje
    return res.status(200).json({ message });
  } else {
    return res.status(204).send(); // No hay mensajes
  }
});

// Ruteo basado en contenido
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

app.use('/api', router);
// Endpoint adicional para ver tópicos activos y sus suscriptores
app.get('/topics', (req, res) => {
  const topics = Object.keys(subscribers).map((topic) => ({
    name: topic,
    subscriberCount: subscribers[topic].length,
  }));
  res.json({ topics });
});

// Middleware de manejo de errores para rutas incorrectas
app.use((req, res, next) => {
  next(new Error('Ruta no encontrada'));
});

// Middleware de manejo de errores personalizado
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});
