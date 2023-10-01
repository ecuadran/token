const http = require('http');
const url = require('url');
const qs = require('querystring');
const mongoose = require('mongoose');
const luhn = require('luhn');
const { v4: uuidv4 } = require('uuid');

// Crear un servidor HTTP
const server = http.createServer((req, res) => {
  // Parsear la URL y los parámetros de consulta
  const parsedUrl = url.parse(req.url, true);

  // Endpoint para tokenizar una tarjeta
  if (req.method === 'POST' && parsedUrl.pathname === '/tokenizar') {
    let requestBody = '';

    req.on('data', (chunk) => {
      requestBody += chunk;
    });

    req.on('end', async () => {
      try {
        const { email, card_number, cvv, expiration_month, expiration_year } = JSON.parse(requestBody);

        // Validaciones
        if (!luhn.validate(card_number)) {
          throw new Error('Número de tarjeta inválido');
        }
        if (cvv.length < 3 || cvv.length > 4) {
          throw new Error('CVV inválido');
        }
        if (!/^\d{1,2}$/.test(expiration_month) || Number(expiration_month) < 1 || Number(expiration_month) > 12) {
          throw new Error('Mes de vencimiento inválido');
        }
        if (!/^\d{4}$/.test(expiration_year) || Number(expiration_year) < new Date().getFullYear() || Number(expiration_year) > new Date().getFullYear() + 5) {
          throw new Error('Año de vencimiento inválido');
        }
        if (!/^[a-zA-Z0-9._-]+@gmail\.com|hotmail\.com|yahoo\.es$/.test(email)) {
          throw new Error('Correo electrónico inválido');
        }

        // Generar un token único
        const token = uuidv4();

        // Almacenar los datos en la base de datos MongoDB (asegúrate de tener MongoDB instalado y ejecutándose)
        mongoose.connect('mongodb://localhost/tokenization-db', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });

        const CardSchema = new mongoose.Schema({
          token: String,
          email: String,
          card_number: String,
          cvv: String,
          expiration_month: String,
          expiration_year: String,
          createdAt: { type: Date, expires: '15m', default: Date.now },
        });

        const Card = mongoose.model('Card', CardSchema);

        const card = new Card({
          token,
          email,
          card_number,
          cvv,
          expiration_month,
          expiration_year,
        });
        await card.save();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: error.message }));
      }
    });
  }
  // Endpoint para obtener datos de tarjeta por token
  else if (req.method === 'GET' && parsedUrl.pathname === '/obtener_tarjeta') {
    const query = parsedUrl.query;
    const token = query.token;

    // Buscar la tarjeta en la base de datos
    mongoose.connect('mongodb://localhost/tokenization-db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const CardSchema = new mongoose.Schema({
      token: String,
      email: String,
      card_number: String,
      cvv: String,
      expiration_month: String,
      expiration_year: String,
      createdAt: { type: Date, expires: '15m', default: Date.now },
    });

    const Card = mongoose.model('Card', CardSchema);

    Card.findOne({ token }).select('-cvv')
      .then((card) => {
        if (card) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(card));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Tarjeta no encontrada' }));
        }
      })
      .catch((error) => {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: error.message }));
      });
  }
  // Ruta no válida
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Ruta no válida' }));
  }
});

// Iniciar el servidor en el puerto 3000
server.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});
