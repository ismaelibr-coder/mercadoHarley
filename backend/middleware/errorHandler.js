import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    logger.error('Error:', err);

    // Mercado Pago errors — description is a curated, user-facing string (e.g. "card
    // declined"); the raw `cause` array below it can carry internal MP error codes/
    // request metadata that has no business reaching the client, so it's logged
    // (above) but no longer echoed back in the response.
    if (err.cause && err.cause.length > 0) {
        return res.status(400).json({
            error: 'Payment error',
            message: err.cause[0].description || err.message
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
};
