import { storage } from "./storage";
import type { InsertEmailNotification } from "@shared/schema";
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: string;
  templateData?: Record<string, any>;
}

interface EmailConfiguration {
  id: string;
  configName: string;
  resendApiKey: string;
  senderEmail: string;
  senderName: string;
  isActive: boolean;
}

const BANK_NAME = 'NorthBridge Capital Bank Ltd.';
const BANK_SHORT = 'NorthBridge';
const BANK_PHONE = '+44 800 555 0199';
const BANK_EMAIL = 'support@northbridgecapital.co.uk';
const BANK_COLOR = '#0A2D5E';
const BANK_ACCENT = '#C5003E';
const BANK_WEBSITE = 'northbridgecapital.co.uk';

function buildEmailWrapper(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BANK_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:${BANK_COLOR};padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display:inline-block;width:36px;height:36px;background:${BANK_ACCENT};border-radius:8px;text-align:center;line-height:36px;font-size:18px;color:#fff;font-weight:bold;vertical-align:middle;">N</span>
                  <span style="color:#ffffff;font-size:20px;font-weight:700;margin-left:10px;vertical-align:middle;">${BANK_SHORT}</span>
                  <span style="color:#C5003E;font-size:10px;font-weight:600;display:block;margin-left:46px;letter-spacing:1px;text-transform:uppercase;">Capital Bank Ltd.</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyContent}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fb;border-top:1px solid #e5e7eb;padding:20px 32px;">
            <p style="margin:0 0 6px;font-size:11px;color:#6b7280;line-height:1.6;">
              This email was sent by <strong>${BANK_NAME}</strong> · Registered in England &amp; Wales No. 09284756 ·
              FCA Authorised No. 778901 · FSCS Protected
            </p>
            <p style="margin:0;font-size:11px;color:#6b7280;">
              If you did not request this email or believe it was sent in error, please contact us at
              <a href="tel:${BANK_PHONE}" style="color:${BANK_ACCENT};">${BANK_PHONE}</a> or
              <a href="mailto:${BANK_EMAIL}" style="color:${BANK_ACCENT};">${BANK_EMAIL}</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function infoBox(rows: { label: string; value: string; highlight?: boolean }[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:8px;margin:20px 0;overflow:hidden;">
    ${rows.map(r => `
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;width:140px;border-bottom:1px solid #e5e7eb;font-weight:600;">${r.label}</td>
        <td style="padding:10px 16px;font-size:13px;color:${r.highlight ? BANK_ACCENT : '#111827'};font-weight:${r.highlight ? '700' : '500'};border-bottom:1px solid #e5e7eb;">${r.value}</td>
      </tr>`).join('')}
  </table>`;
}

export class EmailService {
  private apiKey: string;
  private baseUrl = 'https://api.resend.com';
  private resend: Resend | null = null;
  private activeConfig: EmailConfiguration | null = null;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || '';
    if (this.apiKey) {
      this.resend = new Resend(this.apiKey);
    }
    this.loadActiveConfiguration();
  }

  private async loadActiveConfiguration() {
    try {
      this.activeConfig = await storage.getActiveEmailConfiguration();
      if (this.activeConfig && this.activeConfig.resendApiKey) {
        this.resend = new Resend(this.activeConfig.resendApiKey);
        this.apiKey = this.activeConfig.resendApiKey;
      }
    } catch (error) {
      console.warn('Failed to load email configuration:', error);
    }
  }

  async reloadConfiguration() {
    await this.loadActiveConfiguration();
  }

  private async getEmailConfig(): Promise<EmailConfiguration | null> {
    if (!this.activeConfig) {
      await this.loadActiveConfiguration();
    }
    return this.activeConfig;
  }

  private async getAdminSettingsApiKey(): Promise<string | null> {
    try {
      const raw = (await storage.getAdminSetting('resend_api_key')) ||
                  (await storage.getAdminSetting('sendgrid_api_key'));
      if (!raw || raw === '****' || raw.endsWith('****')) return null;
      return raw;
    } catch {
      return null;
    }
  }

  private processTemplate(content: string, data: Record<string, any>): string {
    let processedContent = content;
    Object.keys(data).forEach(key => {
      const value = data[key] || '';
      processedContent = processedContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return processedContent;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const config = await this.getEmailConfig();
      const adminSettingsKey = await this.getAdminSettingsApiKey();

      let processedHtml = options.html;
      let processedSubject = options.subject;

      if (options.templateData) {
        processedHtml = this.processTemplate(options.html, options.templateData);
        processedSubject = this.processTemplate(options.subject, options.templateData);
      }

      const effectiveKey = adminSettingsKey || config?.resendApiKey || this.apiKey;

      if (options.userId) {
        await storage.createEmailNotification({
          userId: options.userId,
          subject: processedSubject,
          body: processedHtml,
          status: effectiveKey ? 'sent' : 'not_configured',
        });
      }

      if (!effectiveKey) {
        console.log(`Email would be sent to ${options.to}: ${processedSubject}`);
        return true;
      }

      const fromEmail = config
        ? `${config.senderName} <${config.senderEmail}>`
        : `${BANK_NAME} <noreply@northbridgecapital.co.uk>`;

      const resendInstance = adminSettingsKey && adminSettingsKey !== this.apiKey
        ? new Resend(adminSettingsKey)
        : this.resend;

      if (resendInstance) {
        const result = await resendInstance.emails.send({
          from: fromEmail,
          to: [options.to],
          subject: processedSubject,
          html: processedHtml,
        });

        if (result.error) {
          throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
        }
      } else {
        const response = await fetch(`${this.baseUrl}/emails`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${effectiveKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [options.to],
            subject: processedSubject,
            html: processedHtml,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send email: ${response.statusText}`);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      if (options.userId) {
        await storage.createEmailNotification({
          userId: options.userId,
          subject: options.subject,
          body: options.html,
          status: 'failed',
        });
      }
      return false;
    }
  }

  async sendTemplatedEmail(
    templateId: string,
    to: string,
    userId: string,
    templateData: Record<string, any>
  ): Promise<boolean> {
    try {
      const template = await storage.getEmailTemplateById(templateId);
      if (!template) {
        throw new Error('Email template not found');
      }
      return await this.sendEmail({
        to,
        subject: template.subject,
        html: template.htmlContent,
        userId,
        templateData,
      });
    } catch (error) {
      console.error('Failed to send templated email:', error);
      return false;
    }
  }

  async sendTransferNotification(
    userEmail: string,
    userId: string,
    transferAmount: string,
    transferStatus: string,
    transferId: string,
    rejectionReason?: string
  ): Promise<boolean> {
    const templateData = {
      transferAmount,
      transferStatus: transferStatus.charAt(0).toUpperCase() + transferStatus.slice(1),
      transferId,
      rejectionReason: rejectionReason || '',
      customerName: userEmail.split('@')[0],
    };

    try {
      const templates = await storage.getEmailTemplates();
      const transferTemplate = templates.find(t =>
        t.templateType === 'transfer_notification' ||
        t.templateType === 'transfer_' + transferStatus
      );
      if (transferTemplate && transferTemplate.isActive) {
        return await this.sendTemplatedEmail(transferTemplate.id, userEmail, userId, templateData);
      }
    } catch (error) {
      console.warn('Failed to load transfer template, using default:', error);
    }

    const statusLabel = transferStatus.charAt(0).toUpperCase() + transferStatus.slice(1);
    const subject = `Transfer ${statusLabel} — £${transferAmount}`;

    const isRejected = transferStatus === 'rejected' || transferStatus === 'failed';
    const statusColor = isRejected ? '#dc2626' : transferStatus === 'completed' ? '#059669' : '#d97706';

    const body = `
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Transfer Update</h2>
      <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
        We are writing to inform you that your recent transfer has been updated. Please review the details below.
      </p>
      <div style="display:inline-block;padding:8px 18px;background:${statusColor};color:#fff;border-radius:6px;font-weight:700;font-size:14px;margin-bottom:20px;">
        Status: ${statusLabel}
      </div>
      ${infoBox([
        { label: 'Transfer ID', value: transferId },
        { label: 'Amount', value: `£${transferAmount}`, highlight: true },
        { label: 'Status', value: statusLabel },
        ...(rejectionReason ? [{ label: 'Reason', value: rejectionReason, highlight: true }] : []),
      ])}
      <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 12px;">
        ${isRejected
          ? `We regret to inform you that your transfer could not be processed. If you believe this is an error or have any questions, please do not hesitate to contact our customer support team.`
          : `Your transfer has been successfully processed. The funds should be reflected in the recipient's account shortly.`}
      </p>
      <p style="font-size:13px;color:#374151;margin:0;">
        For assistance, please call <strong>${BANK_PHONE}</strong> (available 24/7) or visit
        <a href="https://${BANK_WEBSITE}" style="color:${BANK_ACCENT};">${BANK_WEBSITE}</a>.
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:#374151;">
        Kind regards,<br />
        <strong>Customer Services</strong><br />
        ${BANK_NAME}
      </p>`;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html: buildEmailWrapper(body),
      userId,
      templateData,
    });
  }

  async sendAccountStatusNotification(
    userEmail: string,
    userId: string,
    accountNumber: string,
    newStatus: string,
    reason?: string
  ): Promise<boolean> {
    const templateData = {
      accountNumber,
      newStatus: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
      reason: reason || '',
      customerName: userEmail.split('@')[0],
    };

    try {
      const templates = await storage.getEmailTemplates();
      const statusTemplate = templates.find(t =>
        t.templateType === 'account_status' ||
        t.templateType === 'account_' + newStatus
      );
      if (statusTemplate && statusTemplate.isActive) {
        return await this.sendTemplatedEmail(statusTemplate.id, userEmail, userId, templateData);
      }
    } catch (error) {
      console.warn('Failed to load account status template, using default:', error);
    }

    const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    const subject = `Important: Account Status Update — ${accountNumber}`;

    const isFrozen = newStatus === 'frozen';
    const isClosed = newStatus === 'closed';
    const alertColor = isFrozen ? '#dc2626' : isClosed ? '#6b7280' : '#059669';

    const body = `
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Account Status Update</h2>
      <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
        We are writing to inform you of an important update to your ${BANK_SHORT} account. Please review the details below carefully.
      </p>
      <div style="padding:16px;background:${isFrozen ? '#fef2f2' : isClosed ? '#f9fafb' : '#f0fdf4'};border-left:4px solid ${alertColor};border-radius:0 6px 6px 0;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:${alertColor};font-weight:700;">Account ${statusLabel}</p>
      </div>
      ${infoBox([
        { label: 'Account Number', value: accountNumber },
        { label: 'New Status', value: statusLabel, highlight: true },
        ...(reason ? [{ label: 'Reason', value: reason }] : []),
      ])}
      <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 12px;">
        ${isFrozen
          ? `Your account has been temporarily restricted as a precautionary measure to protect your funds. No debits or transfers can be made while your account is frozen. Please contact our team immediately to resolve this.`
          : isClosed
          ? `Your account has been permanently closed. If you believe this action has been taken in error, please contact us as soon as possible.`
          : `Your account is now active and fully operational. You may continue to use all account features as normal.`}
      </p>
      <p style="font-size:13px;color:#374151;margin:0 0 20px;">
        Please call <strong>${BANK_PHONE}</strong> immediately if you have any questions or did not authorise this change.
      </p>
      <p style="margin:0;font-size:13px;color:#374151;">
        Kind regards,<br />
        <strong>Account Services</strong><br />
        ${BANK_NAME}
      </p>`;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html: buildEmailWrapper(body),
      userId,
      templateData,
    });
  }

  async sendSecurityAlertNotification(
    userEmail: string,
    userId: string,
    alertType: string,
    details: string
  ): Promise<boolean> {
    const templateData = {
      alertType: alertType.charAt(0).toUpperCase() + alertType.slice(1),
      details,
      customerName: userEmail.split('@')[0],
      timestamp: new Date().toLocaleString('en-GB'),
    };

    try {
      const templates = await storage.getEmailTemplates();
      const securityTemplate = templates.find(t =>
        t.templateType === 'security_alert' || t.templateType === 'fraud_alert'
      );
      if (securityTemplate && securityTemplate.isActive) {
        return await this.sendTemplatedEmail(securityTemplate.id, userEmail, userId, templateData);
      }
    } catch (error) {
      console.warn('Failed to load security alert template, using default:', error);
    }

    const subject = `Security Alert — ${alertType}`;

    const body = `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:15px;font-weight:700;color:#dc2626;">⚠ Security Alert: ${alertType}</p>
      </div>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">
        We have detected activity on your ${BANK_SHORT} account that requires your immediate attention. Please review the details below.
      </p>
      ${infoBox([
        { label: 'Alert Type', value: alertType, highlight: true },
        { label: 'Details', value: details },
        { label: 'Date & Time', value: new Date().toLocaleString('en-GB') },
      ])}
      <div style="background:#f0fdf4;border-left:4px solid #059669;border-radius:0 6px 6px 0;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-weight:700;color:#065f46;font-size:13px;">What you should do now:</p>
        <ul style="margin:0;padding-left:20px;color:#065f46;font-size:13px;line-height:2;">
          <li>Log in to your ${BANK_SHORT} account and review recent transactions.</li>
          <li>Change your online banking password immediately if you suspect unauthorised access.</li>
          <li>Contact us if you notice any transactions you do not recognise.</li>
        </ul>
      </div>
      <p style="font-size:13px;color:#374151;margin:0 0 20px;">
        <strong>If you did not authorise this activity, please call us immediately on ${BANK_PHONE}.</strong>
        Our fraud team is available 24 hours a day, 7 days a week.
      </p>
      <p style="margin:0;font-size:13px;color:#374151;">
        Kind regards,<br />
        <strong>Security &amp; Fraud Team</strong><br />
        ${BANK_NAME}
      </p>`;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html: buildEmailWrapper(body),
      userId,
      templateData,
    });
  }

  async sendBalanceChangeNotification(
    userEmail: string,
    userId: string,
    accountNumber: string,
    changeType: 'credit' | 'debit',
    amount: string,
    newBalance: string,
    description: string
  ): Promise<boolean> {
    const isCredit = changeType === 'credit';
    const subject = `Account ${isCredit ? 'Credit' : 'Debit'} — £${amount}`;

    const body = `
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Account Activity Notification</h2>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px;">
        A ${isCredit ? 'credit' : 'debit'} has been applied to your ${BANK_SHORT} account. Please review the details below.
      </p>
      <div style="display:inline-block;padding:8px 18px;background:${isCredit ? '#059669' : '#dc2626'};color:#fff;border-radius:6px;font-weight:700;font-size:14px;margin-bottom:20px;">
        ${isCredit ? '▲ Credit' : '▼ Debit'}: £${amount}
      </div>
      ${infoBox([
        { label: 'Account', value: accountNumber },
        { label: isCredit ? 'Amount Credited' : 'Amount Debited', value: `£${amount}`, highlight: true },
        { label: 'Description', value: description },
        { label: 'New Balance', value: `£${newBalance}`, highlight: true },
        { label: 'Date & Time', value: new Date().toLocaleString('en-GB') },
      ])}
      <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 12px;">
        If you did not authorise this transaction or have any questions, please contact us immediately on
        <strong>${BANK_PHONE}</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#374151;">
        Kind regards,<br />
        <strong>Account Services</strong><br />
        ${BANK_NAME}
      </p>`;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html: buildEmailWrapper(body),
      userId,
    });
  }

  async sendCustomEmail(
    userEmail: string,
    userId: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    const body = `
      <div style="font-size:14px;color:#374151;line-height:1.8;">
        ${message.replace(/\n/g, '<br />')}
      </div>
      <p style="margin:28px 0 0;font-size:13px;color:#374151;">
        Kind regards,<br />
        <strong>Customer Services</strong><br />
        ${BANK_NAME}
      </p>`;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html: buildEmailWrapper(body),
      userId,
    });
  }
}

export const emailService = new EmailService();
