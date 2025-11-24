import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

async function testEmail() {
    console.log('Testing Resend API...');
    console.log('API Key:', process.env.RESEND_API_KEY ? 'Found' : 'Missing');
    console.log('From:', EMAIL_FROM);

    try {
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: ['ismael.ibr@gmail.com'], // User email
            subject: 'Test Email from Mercado Harley',
            html: '<p>It works!</p>'
        });

        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent successfully:', data);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

testEmail();
