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
