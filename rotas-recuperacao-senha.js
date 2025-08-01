// ============================
// ROTAS DE RECUPERAÇÃO DE SENHA
// ============================

const express = require('express');
const rateLimit = require('express-rate-limit');
// Sistema definitivo com conformidade médica
const sistemaRecuperacao = require('./sistema-recuperacao-definitivo');
const nodemailer = require('nodemailer');

const router = express.Router();

// Configurar email (SendGrid)
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Função para enviar email
async function enviarEmailRecuperacao(email, codigo) {
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: '🔑 Código de Recuperação - Portal Dr. Marcio',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Recuperação de Senha</h2>
                <p>Você solicitou a recuperação de sua senha no Portal Dr. Marcio.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <h3 style="color: #374151; margin: 0;">Seu código de verificação:</h3>
                    <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; margin: 10px 0;">
                        ${codigo}
                    </div>
                    <p style="color: #6b7280; margin: 0;">Este código expira em 10 minutos</p>
                </div>
                <p><strong>Instruções:</strong></p>
                <ol>
                    <li>Digite o código de 6 dígitos na página de recuperação</li>
                    <li>Defina sua nova senha</li>
                    <li>Faça login com sua nova senha</li>
                </ol>
                <p style="color: #ef4444;"><strong>⚠️ Importante:</strong> Se você não solicitou esta recuperação, ignore este email e entre em contato conosco.</p>
                <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">
                    Portal Dr. Marcio Scartozzoni<br>
                    Este é um email automático, não responda.
                </p>
            </div>
        `
    };

    await emailTransporter.sendMail(mailOptions);
}

// Rate limiting para recuperação de senha
const limiteRecuperacao = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas por IP
    message: {
        sucesso: false,
        message: 'Muitas tentativas de recuperação. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting para verificação de código
const limiteVerificacao = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // máximo 10 tentativas por IP
    message: {
        sucesso: false,
        message: 'Muitas tentativas de verificação. Tente novamente em 5 minutos.'
    }
});

// Middleware para capturar IP e User-Agent
function capturarInfoRequisicao(req, res, next) {
    req.clienteInfo = {
        ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent']
    };
    next();
}

// POST /api/auth/solicitar-recuperacao
router.post('/solicitar-recuperacao', limiteRecuperacao, capturarInfoRequisicao, async (req, res) => {
    try {
        const { email, reenvio = false } = req.body;
        const { ip, userAgent } = req.clienteInfo;

        // Validações básicas
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                sucesso: false,
                message: 'Email inválido.'
            });
        }

        console.log(`[RECUPERAÇÃO] Solicitação para ${email.substring(0, 3)}***@*** - IP: ${ip}`);

        // Usar sistema definitivo
        const resultado = await sistemaRecuperacao.solicitarRecuperacao(email, ip, userAgent);
        
        if (resultado.sucesso) {
            // Enviar email com código
            try {
                await enviarEmailRecuperacao(email, resultado.codigo);
                
                console.log(`✅ Email enviado para ${email.substring(0, 3)}***@***`);
                
                res.status(200).json({
                    sucesso: true,
                    message: 'Se o email estiver cadastrado, você receberá um código de verificação.',
                    expiracao: resultado.expiracao
                });
                
            } catch (emailError) {
                console.error('❌ Erro enviando email:', emailError.message);
                
                // Log do erro de email
                await sistemaRecuperacao.logarEvento({
                    email,
                    tipo: 'erro_envio_email',
                    ip,
                    userAgent,
                    metadados: { erro: emailError.message }
                });
                
                res.status(500).json({
                    sucesso: false,
                    message: 'Erro interno do servidor. Tente novamente.'
                });
            }
        } else {
            res.status(400).json({
                sucesso: false,
                message: resultado.erro
            });
        }

    } catch (error) {
        console.error('❌ Erro na rota solicitar-recuperacao:', error);
        res.status(500).json({
            sucesso: false,
            message: 'Erro interno do servidor.'
        });
    }
});

// POST /api/auth/verificar-codigo-recuperacao
router.post('/verificar-codigo-recuperacao', limiteVerificacao, capturarInfoRequisicao, async (req, res) => {
    try {
        const { email, codigo } = req.body;
        const { ip, userAgent } = req.clienteInfo;

        // Validações básicas
        if (!email || !codigo) {
            return res.status(400).json({
                sucesso: false,
                message: 'Email e código são obrigatórios.'
            });
        }

        if (!/^\d{6}$/.test(codigo)) {
            return res.status(400).json({
                sucesso: false,
                message: 'Código deve ter 6 dígitos numéricos.'
            });
        }

        console.log(`[VERIFICAÇÃO] Código para ${email.substring(0, 3)}***@*** - IP: ${ip}`);

        const resultado = await sistemaRecuperacao.verificarCodigo(email, codigo, ip, userAgent);
        
        if (resultado.sucesso) {
            res.status(200).json({
                sucesso: true,
                message: 'Código verificado com sucesso. Proceda com a redefinição da senha.',
                token: resultado.token
            });
        } else {
            res.status(400).json({
                sucesso: false,
                message: resultado.erro
            });
        }

    } catch (error) {
        console.error('❌ Erro na rota verificar-codigo-recuperacao:', error);
        res.status(500).json({
            sucesso: false,
            message: 'Erro interno do servidor.'
        });
    }
});

// POST /api/auth/redefinir-senha
router.post('/redefinir-senha', capturarInfoRequisicao, async (req, res) => {
    try {
        const { email, novaSenha, token } = req.body;
        const { ip, userAgent } = req.clienteInfo;

        // Validações básicas
        if (!email || !novaSenha || !token) {
            return res.status(400).json({
                sucesso: false,
                message: 'Todos os campos são obrigatórios.'
            });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                sucesso: false,
                message: 'A senha deve ter pelo menos 6 caracteres.'
            });
        }

        console.log(`[REDEFINIÇÃO] Nova senha para ${email.substring(0, 3)}***@*** - IP: ${ip}`);
        
        const resultado = await sistemaRecuperacao.redefinirSenha(email, novaSenha, token, ip, userAgent);
        
        if (resultado.sucesso) {
            res.status(200).json({
                sucesso: true,
                message: 'Senha redefinida com sucesso! Você pode fazer login com sua nova senha.'
            });
        } else {
            res.status(400).json({
                sucesso: false,
                message: resultado.erro
            });
        }

    } catch (error) {
        console.error('❌ Erro na rota redefinir-senha:', error);
        res.status(500).json({
            sucesso: false,
            message: 'Erro interno do servidor.'
        });
    }
});

// GET /api/auth/status-recuperacao (para debugs - remover em produção)
router.get('/status-recuperacao', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(404).json({ message: 'Não encontrado.' });
    }
    
    const status = sistemaRecuperacao.obterEstatisticas();
    res.json(status);
});

// Limpeza periódica de códigos expirados (a cada 10 minutos)
setInterval(() => {
    sistemaRecuperacao.limparCodigosExpirados();
    console.log('[RECUPERAÇÃO] Limpeza de códigos expirados executada');
}, 10 * 60 * 1000);

module.exports = router;
