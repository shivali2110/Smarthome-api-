const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Header se token lo
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Token verify karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // user info request me attach karo
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }
};

module.exports = authMiddleware;
