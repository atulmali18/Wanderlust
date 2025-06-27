const express = require('express');
const router = express.Router();
const { generateToken } = require('../utils/jwtUtils');
const User = require('../models/user');
const { authenticateJWT } = require('../middleware');

// Login route that returns JWT
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !await user.authenticate(password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Protected route example
router.get('/protected', authenticateJWT, (req, res) => {
    res.json({ message: 'You have access to this protected route', user: req.user });
});

module.exports = router;