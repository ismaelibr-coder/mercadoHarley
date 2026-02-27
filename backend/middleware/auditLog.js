import { AuditLog } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';

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
                id: `audit_${uuidv4()}`,
                action,
                userId: req.user?.uid || null,
                resource: req.path.split('/')[2] || null,
                resourceId: req.params?.id || null,
                changes: {
                    method: req.method,
                    statusCode: res.statusCode,
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent')
                }
            };

            // Salvar log no MySQL (não bloquear resposta)
            AuditLog.create(logEntry)
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
        await AuditLog.create({
            id: `audit_${uuidv4()}`,
            action: 'AUTH_FAILURE',
            userId: null,
            resource: 'auth',
            resourceId: email,
            changes: {
                reason,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            }
        });
    } catch (error) {
        console.error('Error saving auth failure audit log:', error);
    }
};
        console.error('Error saving auth failure log:', error);
    }
};
