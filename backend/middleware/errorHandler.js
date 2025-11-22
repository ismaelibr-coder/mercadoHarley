export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Mercado Pago errors
    if (err.cause && err.cause.length > 0) {
        return res.status(400).json({
            error: 'Payment error',
            message: err.cause[0].description || err.message,
            details: err.cause
        });
    }

    // Firebase errors
    if (err.code && err.code.startsWith('auth/')) {
        return res.status(401).json({
            error: 'Authentication error',
            message: err.message
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
};
