const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');

router.get('/products', (req, res) => {
    // Handle fetching all products
});

router.post('/products', (req, res) => {
    // Handle adding a new product
});

// ... other product-related routes ...

module.exports = router;
