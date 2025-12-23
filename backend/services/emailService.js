import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization to prevent crash when API key is missing
let resend = null;
const getResend = () => {
    if (!resend && process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const APP_NAME = 'Mercado Harley';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Send a welcome email to a new user
 * @param {Object} user - User object { email, displayName }
 */
export const sendWelcomeEmail = async (user) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not found. Skipping welcome email.');
            return;
        }

        const { data, error } = await getResend()?.emails.send({
            from: `${APP_NAME} <${EMAIL_FROM}>`,
            to: [user.email],
            subject: `Bem-vindo ao ${APP_NAME}!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #333333; border-radius: 8px;">
                                    <!-- Header with Logo -->
                                    <tr>
                                        <td align="center" style="padding: 30px 20px; background-color: #ff6600; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                                🏍️ MERCADO HARLEY
                                            </h1>
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #ff6600; margin: 0 0 20px 0; font-size: 24px;">Bem-vindo, ${user.displayName || 'Motociclista'}!</h2>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Estamos muito felizes em tê-lo conosco na maior comunidade de peças e acessórios para Harley-Davidson.
                                            </p>
                                            <div style="background-color: #2a2a2a; border-left: 4px solid #ff6600; padding: 20px; margin: 20px 0;">
                                                <h3 style="color: #ff6600; margin: 0 0 15px 0; font-size: 18px;">Agora você pode:</h3>
                                                <ul style="color: #cccccc; margin: 0; padding-left: 20px;">
                                                    <li style="margin-bottom: 10px;">Navegar pelo nosso catálogo completo de peças originais</li>
                                                    <li style="margin-bottom: 10px;">Fazer pedidos com segurança e praticidade</li>
                                                    <li style="margin-bottom: 10px;">Acompanhar o status das suas entregas em tempo real</li>
                                                    <li>Receber ofertas exclusivas para membros</li>
                                                </ul>
                                            </div>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                                                Se precisar de ajuda, nossa equipe está à disposição.
                                            </p>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 20px 30px; background-color: #0a0a0a; border-radius: 0 0 8px 8px; border-top: 1px solid #333333;">
                                            <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">
                                                Este é um email automático, por favor não responda.<br>
                                                © ${new Date().getFullYear()} Mercado Harley - Todos os direitos reservados
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error sending welcome email:', error);
            return { success: false, error };
        }

        console.log('Welcome email sent successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Exception sending welcome email:', err);
        return { success: false, error: err };
    }
};

/**
 * Send order confirmation email
 * @param {Object} order - Order object
 */
export const sendOrderConfirmation = async (order) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not found. Skipping order confirmation email.');
            return;
        }

        const itemsList = order.items.map(item =>
            `<li style="color: #cccccc; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #444444;">
                <strong style="color: #ffffff; font-size: 16px;">${item.name}</strong><br>
                <span style="color: #999999; font-size: 14px;">Qtd: ${item.quantity} x R$ ${item.price.toFixed(2)}</span>
            </li>`
        ).join('');

        const { data, error } = await getResend()?.emails.send({
            from: `${APP_NAME} <${EMAIL_FROM}>`,
            to: [order.customer.email],
            subject: `Pedido Confirmado #${order.id.slice(0, 8).toUpperCase()}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #333333; border-radius: 8px;">
                                    <tr>
                                        <td align="center" style="padding: 30px 20px; background-color: #ff6600; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">🏍️ MERCADO HARLEY</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #ff6600; margin: 0 0 20px 0; font-size: 24px;">Pedido Confirmado! 🎉</h2>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Olá ${order.customer.name},</p>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Recebemos seu pedido com sucesso. O pagamento foi aprovado e já estamos preparando seus itens.</p>
                                            <div style="background-color: #2a2a2a; border: 1px solid #ff6600; border-radius: 5px; padding: 20px; margin: 20px 0;">
                                                <h3 style="color: #ff6600; margin: 0 0 15px 0; font-size: 18px;">Pedido #${order.id.slice(0, 8).toUpperCase()}</h3>
                                                <ul style="list-style: none; padding: 0; margin: 0;">
                                                    ${itemsList}
                                                </ul>
                                                <p style="color: #ff6600; font-weight: bold; font-size: 20px; margin: 20px 0 0 0; padding-top: 15px; border-top: 1px solid #444444;">Total: R$ ${order.total.toFixed(2)}</p>
                                            </div>
                                            <div style="background-color: #2a2a2a; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                                <h4 style="color: #ff6600; margin: 0 0 10px 0; font-size: 16px;">📍 Endereço de Entrega:</h4>
                                                <p style="color: #cccccc; margin: 0; line-height: 1.6;">
                                                    ${order.shipping.address}, ${order.shipping.number}<br>
                                                    ${order.shipping.neighborhood} - ${order.shipping.city}/${order.shipping.state}<br>
                                                    CEP: ${order.shipping.zipCode}
                                                </p>
                                            </div>
                                            <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">Você receberá outro email assim que seu pedido for enviado.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 30px; background-color: #0a0a0a; border-radius: 0 0 8px 8px; border-top: 1px solid #333333;">
                                            <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">© ${new Date().getFullYear()} Mercado Harley - Todos os direitos reservados</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error sending order confirmation email:', error);
            return { success: false, error };
        }

        console.log('Order confirmation email sent successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Exception sending order confirmation email:', err);
        return { success: false, error: err };
    }
};

/**
 * Send order status update email
 * @param {Object} order - Order object
 * @param {string} status - New status
 */
export const sendOrderStatusUpdate = async (order, status) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not found. Skipping status update email.');
            return;
        }

        // Get status or use order.status if already passed
        const currentStatus = status || order.status;
        let statusMessage = '';
        let color = '#333';

        switch (currentStatus) {
            case 'processing':
                statusMessage = 'Seu pedido está sendo processado.';
                color = '#3b82f6';
                break;
            case 'shipped':
                statusMessage = 'Seu pedido foi enviado! 🚚';
                color = '#10b981';
                break;
            case 'delivered':
                statusMessage = 'Seu pedido foi entregue! 🎉';
                color = '#059669';
                break;
            case 'cancelled':
                statusMessage = 'Seu pedido foi cancelado.';
                color = '#ef4444';
                break;
            default:
                statusMessage = `Status atualizado: ${currentStatus}`;
                color = '#ff6600';
        }

        const { data, error } = await getResend()?.emails.send({
            from: `${APP_NAME} <${EMAIL_FROM}>`,
            to: [order.customer.email],
            subject: `Atualização do Pedido #${order.id.slice(0, 8).toUpperCase()}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #333333; border-radius: 8px;">
                                    <tr>
                                        <td align="center" style="padding: 30px 20px; background-color: #ff6600; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">🏍️ MERCADO HARLEY</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #ff6600; margin: 0 0 20px 0; font-size: 24px;">Atualização de Pedido</h2>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Olá ${order.customer.name},</p>
                                            <div style="background-color: ${color}22; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; border-radius: 5px;">
                                                <h3 style="color: ${color}; margin: 0; font-size: 20px;">${statusMessage}</h3>
                                            </div>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 20px 0;">Para ver mais detalhes, acesse sua conta no site.</p>
                                            <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                                                <tr>
                                                    <td style="background-color: #ff6600; border-radius: 5px; padding: 12px 24px;">
                                                        <a href="${FRONTEND_URL}/my-orders" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">Ver Meus Pedidos</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 30px; background-color: #0a0a0a; border-radius: 0 0 8px 8px; border-top: 1px solid #333333;">
                                            <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">© ${new Date().getFullYear()} Mercado Harley - Todos os direitos reservados</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error sending status update email:', error);
            return { success: false, error };
        }

        console.log('Status update email sent successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Exception sending status update email:', err);
        return { success: false, error: err };
    }
};

/**
 * Send shipping notification with tracking code
 * @param {Object} order - Order object
 * @param {string} trackingCode - Tracking code
 * @param {Date} estimatedDelivery - Estimated delivery date
 */
export const sendShippingNotification = async (order, trackingCode, estimatedDelivery) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not found. Skipping shipping notification email.');
            return;
        }

        // Only send email if we have a valid tracking code
        if (!trackingCode || trackingCode === 'null' || trackingCode === null) {
            console.warn('No valid tracking code. Skipping shipping notification email.');
            return;
        }

        const deliveryDate = estimatedDelivery
            ? new Date(estimatedDelivery).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            })
            : 'A confirmar';

        // Tracking URL (Correios or carrier)
        const trackingUrl = `https://rastreamento.correios.com.br/app/index.php?codigo=${trackingCode}`;

        const { data, error } = await getResend()?.emails.send({
            from: `SICK GRIP <${EMAIL_FROM}>`,
            to: [order.customer.email],
            subject: `🚚 Pedido Enviado #${order.orderNumber || order.id.slice(0, 8).toUpperCase()} - Código de Rastreio`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #333333; border-radius: 8px;">
                                    <tr>
                                        <td align="center" style="padding: 30px 20px; background-color: #DC2626; border-radius: 8px 8px 0 0;">
                                            <img src="https://sickgrip.com.br/images/sickgrip-logo.png" alt="SICK GRIP" style="max-width: 120px; height: auto; margin-bottom: 10px;" />
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">SICK GRIP</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #DC2626; margin: 0 0 20px 0; font-size: 24px;">Seu Pedido Foi Enviado! 🚚</h2>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Olá ${order.customer.name},</p>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Ótimas notícias! Seu pedido já está a caminho.</p>
                                            
                                            <div style="background-color: #2a2a2a; border: 2px solid #10b981; border-radius: 8px; padding: 25px; margin: 25px 0;">
                                                <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">📦 Informações de Rastreamento</h3>
                                                <div style="background-color: #1a1a1a; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                                                    <p style="color: #999999; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Código de Rastreio</p>
                                                    <p style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 2px;">${trackingCode}</p>
                                                </div>
                                                <div style="background-color: #1a1a1a; padding: 15px; border-radius: 5px;">
                                                    <p style="color: #999999; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Previsão de Entrega</p>
                                                    <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: bold;">📅 ${deliveryDate}</p>
                                                </div>
                                            </div>

                                            <table cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                                                <tr>
                                                    <td style="background-color: #10b981; border-radius: 5px; padding: 15px 30px;">
                                                        <a href="${trackingUrl}" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; text-transform: uppercase;">🔍 Rastrear Pedido</a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <div style="background-color: #2a2a2a; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                                <h4 style="color: #DC2626; margin: 0 0 10px 0; font-size: 16px;">📍 Endereço de Entrega:</h4>
                                                <p style="color: #cccccc; margin: 0; line-height: 1.6;">
                                                    ${order.shipping.address}, ${order.shipping.number}<br>
                                                    ${order.shipping.neighborhood} - ${order.shipping.city}/${order.shipping.state}<br>
                                                    CEP: ${order.shipping.cep}
                                                </p>
                                            </div>

                                            <div style="background-color: #1a3a52; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
                                                <p style="color: #cccccc; margin: 0; font-size: 14px; line-height: 1.6;">
                                                    💡 <strong style="color: #ffffff;">Dica:</strong> Você pode acompanhar seu pedido em tempo real usando o código de rastreio acima.
                                                </p>
                                            </div>

                                            <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                                Você receberá outro email assim que seu pedido for entregue.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 30px; background-color: #0a0a0a; border-radius: 0 0 8px 8px; border-top: 1px solid #333333;">
                                            <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">© ${new Date().getFullYear()} SICK GRIP - Todos os direitos reservados</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error sending shipping notification email:', error);
            return { success: false, error };
        }

        console.log('Shipping notification email sent successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Exception sending shipping notification email:', err);
        return { success: false, error: err };
    }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} link - Password reset link
 */
export const sendPasswordReset = async (email, link) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not found. Skipping password reset email.');
            return;
        }

        const { data, error } = await getResend()?.emails.send({
            from: `${APP_NAME} <${EMAIL_FROM}>`,
            to: [email],
            subject: `Recuperação de Senha - ${APP_NAME}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #333333; border-radius: 8px;">
                                    <tr>
                                        <td align="center" style="padding: 30px 20px; background-color: #ff6600; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">🏍️ MERCADO HARLEY</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #ff6600; margin: 0 0 20px 0; font-size: 24px;">Recuperação de Senha 🔐</h2>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Recebemos uma solicitação para redefinir sua senha.</p>
                                            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Clique no botão abaixo para criar uma nova senha:</p>
                                            <table cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                                                <tr>
                                                    <td style="background-color: #ff6600; border-radius: 5px; padding: 15px 30px;">
                                                        <a href="${link}" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; text-transform: uppercase;">Redefinir Senha</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <div style="background-color: #2a2a2a; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                                <p style="color: #999999; font-size: 13px; margin: 0 0 10px 0;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                                                <p style="color: #ff6600; font-size: 12px; margin: 0; word-break: break-all;">${link}</p>
                                            </div>
                                            <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">Se você não solicitou isso, pode ignorar este email com segurança.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 30px; background-color: #0a0a0a; border-radius: 0 0 8px 8px; border-top: 1px solid #333333;">
                                            <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">© ${new Date().getFullYear()} Mercado Harley - Todos os direitos reservados</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error sending password reset email:', error);
            return { success: false, error };
        }

        console.log('Password reset email sent successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Exception sending password reset email:', err);
        return { success: false, error: err };
    }
};

