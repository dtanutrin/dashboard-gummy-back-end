// Caminho: dashboard-gummy-back-end/services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do serviço de email
const createTransporter = () => {
  const service = process.env.EMAIL_SERVICE || 'outlook';
  
  // Configurações específicas para diferentes serviços de email
  if (service.toLowerCase() === 'outlook') {
    return nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });
  } else if (service.toLowerCase() === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      }
    });
  } else {
    // Configuração genérica
    return nodemailer.createTransport({
      service: service,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      }
    });
  }
};

/**
 * Envia um email com o token de recuperação de senha
 * @param {string} to - Email do destinatário
 * @param {string} token - Token de recuperação de senha
 * @returns {Promise} - Promessa que resolve quando o email é enviado
 */
export const sendPasswordResetEmail = async (to, token) => {
  try {
    const transporter = createTransporter();
    
    // URL do frontend para redefinição de senha
    const resetUrl = `${process.env.FRONTEND_URL || 'https://dta-gummy.netlify.app'}/auth/reset-password?token=${token}`;
    
    // Configuração do email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Redefinição de Senha - Gummy Dashboards',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://dta-gummy.netlify.app/images/v2_marca_dta_gummy.png" alt="Gummy Original" style="max-width: 200px;">
          </div>
          <h2 style="color: #333; text-align: center;">Relatórios e Dashboards</h2>
          <h3 style="color: #666; text-align: center;">Redefinição de Senha</h3>
          <p style="color: #666; line-height: 1.5;">Olá,</p>
          <p style="color: #666; line-height: 1.5;">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Redefinir Senha</a>
          </div>
          <p style="color: #666; line-height: 1.5;">Se você não solicitou a redefinição de senha, ignore este email.</p>
          <p style="color: #666; line-height: 1.5;">Este link é válido por 1 hora.</p>
          <hr style="border: none; border-top: 1px solid #e1e1e1; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2025 Gummy Dashboards. Todos os direitos reservados.</p>
        </div>
      `,
    };

    // Envia o email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email de recuperação de senha');
  }
};

export default {
  sendPasswordResetEmail,
};
