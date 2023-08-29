require('dotenv').config();
const express = require('express');
const app = express();
let PORT = 3000;
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const imageRoutes = require('./routes/imageRoutes');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// Setup the logger to use the 'combined' format and write to access.log
app.use(morgan('combined', { stream: accessLogStream }));

app.get('/prompt', (req, res) => {
    res.sendFile(__dirname + '/public/prompt_input.html');
});

mongoose.connect('mongodb://localhost:27017/technosmack', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(error => console.error('Could not connect to MongoDB', error));

// Parse incoming request bodies in a middleware before your handlers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(productRoutes);
app.use('/api/images', imageRoutes);
app.use(express.static('public'));
app.use(morgan('combined'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Queue to hold the requests
const requestQueue = [];

// Function to process the queue
const processQueue = async () => {
  if (requestQueue.length === 0) {
    return;
  }

  const { params, res } = requestQueue.shift();

  try {
    const response = await axios.post('https://omniinfer.p.rapidapi.com/v2/txt2img', params);
    const imageUrl = response.data.data.imageUrl; // Adjust based on actual response structure

    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ status: 'error', errorMessage: 'Failed to generate image' });
  }

  // Wait for 1 second before processing the next item
  setTimeout(processQueue, 1002);
};

app.get('/generateImage', (req, res) => {
  const params = req.query; // Assuming you're sending parameters as query params

  // Add the request to the queue
  requestQueue.push({ params, res });

  // If this is the only request in the queue, start processing
  if (requestQueue.length === 1) {
    processQueue();
  }
});

// Function to start the server on the next available port if the current one is in use
function startServer(app) {
    const server = http.createServer(app);
    server.listen(PORT);
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is in use, trying the next one...`);
            PORT++;
            startServer(app);
        } else {
            console.error('Failed to start the server:', error);
        }
    });
    server.on('listening', () => {
        console.log(`Server started on http://localhost:${PORT}`);
    });
}

// Start the server
startServer(app);
