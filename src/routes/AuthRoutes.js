const express = require('express');
const {
    signin,
} = require('../controllers/AuthController');

const router = express.Router();

// User routes
router.post('/signin', signin); // SignIn
module.exports = router;
