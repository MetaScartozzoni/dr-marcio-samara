const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json());

// Health check endpoint (OBRIGATÓRIO para Railway)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        services: {
            sendgrid: process.env.SENDGRID_API_KEY ? 'configured' : 'missing',
            twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'missing'
        }
    });
});

// Página inicial simples
app.get('/', (req, res) => {
    res.send(`
        <h1>🏥 Portal Dr. Marcio - FUNCIONANDO!</h1>
        <p>✅ Servidor online na porta ${PORT}</p>
        <p>✅ Health check: <a href="/api/health">/api/health</a></p>
        <p>📧 SendGrid: ${process.env.SENDGRID_API_KEY ? '✅ Configurado' : '❌ Faltando'}</p>
        <p>📱 Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ Faltando'}</p>
    `);
});

// Teste SendGrid
app.get('/api/email/test', async (req, res) => {
    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        res.json({
            status: 'SendGrid Ready',
            apiKey: process.env.SENDGRID_API_KEY ? 'Configured' : 'Missing'
        });
    } catch (error) {
        res.json({
            status: 'SendGrid Error',
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Portal Dr. Marcio rodando na porta ${PORT}`);
    console.log(`📧 SendGrid: ${process.env.SENDGRID_API_KEY ? 'OK' : 'FALTANDO'}`);
    console.log(`📱 Twilio: ${process.env.TWILIO_ACCOUNT_SID ? 'OK' : 'FALTANDO'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
