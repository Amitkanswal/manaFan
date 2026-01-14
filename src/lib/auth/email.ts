import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@mangafan.com';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'MangaFan';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendMagicLinkEmail(email: string, token: string): Promise<boolean> {
  const magicLink = `${APP_URL}/api/auth/verify-magic-link?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 40px; }
        .logo { font-size: 28px; font-weight: bold; color: #f97316; margin-bottom: 24px; }
        h1 { color: #f5f5f5; font-size: 24px; margin-bottom: 16px; }
        p { color: #a3a3a3; line-height: 1.6; margin-bottom: 16px; }
        .button { display: inline-block; background: #f97316; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
        .button:hover { background: #ea580c; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #333; color: #737373; font-size: 14px; }
        .link { color: #f97316; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">📚 MangaFan</div>
        <h1>Sign in to MangaFan</h1>
        <p>Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
        <a href="${magicLink}" class="button">Sign In to MangaFan</a>
        <p style="font-size: 14px;">Or copy and paste this URL into your browser:</p>
        <p class="link" style="font-size: 12px;">${magicLink}</p>
        <div class="footer">
          <p>If you didn't request this email, you can safely ignore it.</p>
          <p>© ${new Date().getFullYear()} MangaFan. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Sign in to MangaFan',
    html,
  });
}

export async function sendNewChapterNotification(
  email: string,
  userName: string | null,
  mangaTitle: string,
  mangaSlug: string,
  chapterTitle: string,
  chapterSlug: string
): Promise<boolean> {
  const chapterUrl = `${APP_URL}/${mangaSlug}/${chapterSlug}`;
  const mangaUrl = `${APP_URL}/${mangaSlug}`;
  const unsubscribeUrl = `${APP_URL}/profile?unsubscribe=${mangaSlug}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 40px; }
        .logo { font-size: 28px; font-weight: bold; color: #f97316; margin-bottom: 24px; }
        h1 { color: #f5f5f5; font-size: 24px; margin-bottom: 16px; }
        p { color: #a3a3a3; line-height: 1.6; margin-bottom: 16px; }
        .manga-title { color: #f97316; font-weight: bold; }
        .chapter-box { background: #262626; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #f97316; }
        .chapter-title { color: #f5f5f5; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .button { display: inline-block; background: #f97316; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
        .button:hover { background: #ea580c; }
        .secondary-button { display: inline-block; background: transparent; color: #f97316 !important; padding: 14px 32px; border: 2px solid #f97316; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #333; color: #737373; font-size: 14px; }
        .unsubscribe { color: #737373; font-size: 12px; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">📚 MangaFan</div>
        <h1>New Chapter Alert! 🎉</h1>
        <p>Hey ${userName || 'Reader'}!</p>
        <p>Great news! A new chapter of <span class="manga-title">${mangaTitle}</span> is now available.</p>
        
        <div class="chapter-box">
          <div class="chapter-title">${chapterTitle}</div>
          <p style="margin: 0; color: #737373;">Just released!</p>
        </div>

        <a href="${chapterUrl}" class="button">Read Now →</a>
        <a href="${mangaUrl}" class="secondary-button">View All Chapters</a>

        <div class="footer">
          <p>You're receiving this because you subscribed to updates for ${mangaTitle}.</p>
          <p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe from ${mangaTitle} updates</a></p>
          <p>© ${new Date().getFullYear()} MangaFan. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `📖 New Chapter: ${mangaTitle} - ${chapterTitle}`,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string | null): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 40px; }
        .logo { font-size: 28px; font-weight: bold; color: #f97316; margin-bottom: 24px; }
        h1 { color: #f5f5f5; font-size: 24px; margin-bottom: 16px; }
        p { color: #a3a3a3; line-height: 1.6; margin-bottom: 16px; }
        .feature { background: #262626; border-radius: 8px; padding: 16px; margin: 12px 0; }
        .feature-title { color: #f97316; font-weight: 600; margin-bottom: 4px; }
        .button { display: inline-block; background: #f97316; color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #333; color: #737373; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">📚 MangaFan</div>
        <h1>Welcome to MangaFan! 🎊</h1>
        <p>Hey ${name || 'Reader'}!</p>
        <p>Thanks for joining MangaFan. Here's what you can do now:</p>
        
        <div class="feature">
          <div class="feature-title">📖 Track Your Reading</div>
          <p style="margin: 0; font-size: 14px;">Your progress is automatically saved as you read.</p>
        </div>
        
        <div class="feature">
          <div class="feature-title">🔔 Get Notified</div>
          <p style="margin: 0; font-size: 14px;">Subscribe to manga and get email alerts for new chapters.</p>
        </div>
        
        <div class="feature">
          <div class="feature-title">⭐ Rate & Review</div>
          <p style="margin: 0; font-size: 14px;">Share your thoughts and help others discover great manga.</p>
        </div>

        <a href="${APP_URL}/discover" class="button">Start Exploring</a>

        <div class="footer">
          <p>Happy reading!</p>
          <p>© ${new Date().getFullYear()} MangaFan. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to MangaFan!',
    html,
  });
}

