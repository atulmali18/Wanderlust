const { verifyToken } = require('../utils/jwtUtils');

module.exports = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    try {
        const user = verifyToken(token);
        req.user = user; 
        res.json({ user });
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};