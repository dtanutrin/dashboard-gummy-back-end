// Solução para o problema de recuperação de senha por e-mail
// Este arquivo deve substituir o arquivo original em /home/ubuntu/dashboard-gummy-back-end/services/emailService.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do serviço de email simplificada
const createTransporter = () => {
  // Usar serviço SMTP genérico que funciona com a maioria dos provedores
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.office365.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // Permite conexões mesmo com certificados auto-assinados
    }
  });
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
    console.log('Tentando enviar email para:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email de recuperação de senha');
  }
};

// Função alternativa para envio de email sem autenticação (para testes)
export const sendPasswordResetEmailNoAuth = async (to, token) => {
  try {
    // Criar um transportador de teste que não envia emails reais
    // mas registra no console para fins de teste
    const testAccount = await nodemailer.createTestAccount();
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    // URL do frontend para redefinição de senha
    const resetUrl = `${process.env.FRONTEND_URL || 'https://dta-gummy.netlify.app'}/auth/reset-password?token=${token}`;
    
    // Configuração do email
    const mailOptions = {
      from: '"Gummy Dashboards" <no-reply@gummy.com>',
      to,
      subject: 'Redefinição de Senha - Gummy Dashboards',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Relatórios e Dashboards</h2>
          <h3 style="color: #666; text-align: center;">Redefinição de Senha</h3>
          <p style="color: #666; line-height: 1.5;">Olá,</p>
          <p style="color: #666; line-height: 1.5;">Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Redefinir Senha</a>
          </div>
          <p style="color: #666; line-height: 1.5;">Se você não solicitou a redefinição de senha, ignore este email.</p>
          <p style="color: #666; line-height: 1.5;">Este link é válido por 1 hora.</p>
          <p style="color: #666; line-height: 1.5;">Token: ${token}</p>
        </div>
      `,
    };

    // Envia o email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado (teste):', info.messageId);
    console.log('URL de visualização:', nodemailer.getTestMessageUrl(info));
    
    return {
      ...info,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    throw new Error('Falha ao enviar email de recuperação de senha');
  }
};

export default {
  sendPasswordResetEmail,
  sendPasswordResetEmailNoAuth
};
