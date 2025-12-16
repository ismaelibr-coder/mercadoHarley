import { getFirestore } from 'firebase-admin/firestore';

/**
 * Audit log middleware for tracking administrative actions
 * @param {string} action - Description of the action being performed
 */
export const auditLog = (action) => async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
        // Log após resposta bem-sucedida (status < 400)
        if (res.statusCode < 400) {
            const logEntry = {
                action,
                user: req.user?.email || 'anonymous',
                userId: req.user?.uid || null,
                timestamp: new Date(),
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                method: req.method,
                path: req.path,
                statusCode: res.statusCode
            };

            // Salvar log no Firestore (não bloquear resposta)
            getFirestore()
                .collection('audit_logs')
                .add(logEntry)
                .catch(error => {
                    console.error('Error saving audit log:', error);
                });
        }

        originalSend.call(this, data);
    };

    next();
};

/**
 * Audit log for failed authentication attempts
 */
export const auditAuthFailure = async (email, reason, req) => {
    try {
        await getFirestore().collection('audit_logs').add({
            action: 'AUTH_FAILURE',
            email,
            reason,
            timestamp: new Date(),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        });
    } catch (error) {
        console.error('Error saving auth failure log:', error);
    }
};
