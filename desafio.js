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

// Middleware de nivel de direccionador
const router = express.Router();
app.use('/api', router);

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

router.use((req, res, next) => {
  console.log('Middleware de nivel de direccionador ejecutado.');
  next();
});

app.get('', (req, res, next) => {
  res.send('¡Desde la raiz /!');
});

app.get('/test', (req, res) => {
  res.send('¡test!');
});

router.get('/test', (req, res) => {
  res.send('¡api test!');
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
