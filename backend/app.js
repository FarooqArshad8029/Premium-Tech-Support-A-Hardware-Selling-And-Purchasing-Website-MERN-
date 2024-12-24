const express = require("express");
const dotenv = require('dotenv');
const ErrorMiddleware = require("./middleware/Error");
const user = require('./routes/user');
const product = require('./routes/product');
const order = require('./routes/order');
const category = require('./routes/category');
const container = require('./routes/container');
const cookieParser = require("cookie-parser");
const cors = require('cors');


const app = express();


dotenv.config();

app.use(cors({
    origin: process.env.FRONTEND_URL, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: 'Content-Type, Authorization, Origin, X-Requested-With, Accept'
  }));

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());
//Routes
app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', category);
app.use('/api/v1', container);

module.exports = app;

app.use(ErrorMiddleware);