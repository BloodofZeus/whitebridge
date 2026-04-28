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

  // Reload configuration when needed (for testing purposes)
  async reloadConfiguration() {
    await this.loadActiveConfiguration();
  }

  private async getEmailConfig(): Promise<EmailConfiguration | null> {
    if (!this.activeConfig) {
      await this.loadActiveConfiguration();
    }
    return this.activeConfig;
  }

  /**
   * Attempt to resolve the Resend API key from admin settings.
   * Reads 'resend_api_key' first, falls back to legacy 'sendgrid_api_key'.
   * Returns null if not set or if the stored value is a masked placeholder.
   */
  private async getAdminSettingsApiKey(): Promise<string | null> {
    try {
      const raw = (await storage.getAdminSetting('resend_api_key')) ||
                  (await storage.getAdminSetting('sendgrid_api_key')); // backward compat
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

      // Admin Settings key takes priority over env var / email config table
      const adminSettingsKey = await this.getAdminSettingsApiKey();

      // Process template data if provided
      let processedHtml = options.html;
      let processedSubject = options.subject;
      
      if (options.templateData) {
        processedHtml = this.processTemplate(options.html, options.templateData);
        processedSubject = this.processTemplate(options.subject, options.templateData);
      }

      const effectiveKey = adminSettingsKey || config?.resendApiKey || this.apiKey;

      // Log email notification to database
      if (options.userId) {
        await storage.createEmailNotification({
          userId: options.userId,
          subject: processedSubject,
          body: processedHtml,
          status: effectiveKey ? 'sent' : 'not_configured',
        });
      }

      // If no API key, log and return success (graceful no-op)
      if (!effectiveKey) {
        console.log(`Email would be sent to ${options.to}: ${processedSubject}`);
        return true;
      }

      // Use configuration or fallback
      const fromEmail = config ? `${config.senderName} <${config.senderEmail}>` : 'Finora Bank <noreply@finora.bank>';

      // If admin settings key differs from current resend instance, create a fresh one
      const resendInstance = adminSettingsKey && adminSettingsKey !== this.apiKey
        ? new Resend(adminSettingsKey)
        : this.resend;

      if (resendInstance) {
        // Use Resend SDK
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
        // Fallback to direct API call
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
      
      // Update email notification status to failed
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
      customerName: userEmail.split('@')[0], // Simple fallback
    };

    // Try to find a transfer notification template first
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

    // Fallback to default template
    const subject = `Transfer ${transferStatus.charAt(0).toUpperCase() + transferStatus.slice(1)} - $${transferAmount}`;
    
    let html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #EC0000; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Santander Bank</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin: 0 0 20px 0;">Transfer Update</h2>
          
          <p style="color: #374151; margin: 0 0 15px 0;">
            Your transfer of <strong>$${transferAmount}</strong> is now <strong>${transferStatus}</strong>.
          </p>
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280;"><strong>Transfer ID:</strong> ${transferId}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Status:</strong> ${transferStatus}</p>
            ${rejectionReason ? `<p style="margin: 5px 0 0 0; color: #dc2626;"><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          </div>
          
          <p style="color: #374151; margin: 20px 0 0 0;">
            ${transferStatus === 'rejected' || transferStatus === 'failed' 
              ? 'If you have any questions, please contact customer service at 1-877-768-2265.' 
              : 'Thank you for banking with Santander.'}
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
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

    // Try to find an account status template first
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

    // Fallback to default template
    const subject = `Account Status Update - ${accountNumber}`;
    
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #EC0000; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Santander Bank</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin: 0 0 20px 0;">Account Status Update</h2>
          
          <p style="color: #374151; margin: 0 0 15px 0;">
            The status of your account <strong>${accountNumber}</strong> has been updated to <strong>${newStatus}</strong>.
          </p>
          
          ${reason ? `
            <div style="background-color: ${newStatus === 'frozen' ? '#fef2f2' : 'white'}; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${newStatus === 'frozen' ? '#dc2626' : '#059669'};">
              <p style="margin: 0; color: #6b7280;"><strong>Reason:</strong> ${reason}</p>
            </div>
          ` : ''}
          
          <p style="color: #374151; margin: 20px 0 0 0;">
            ${newStatus === 'frozen' 
              ? 'Your account has been temporarily frozen for your security. Please contact customer service immediately at 1-877-768-2265 to resolve this issue.'
              : newStatus === 'closed'
              ? 'Your account has been closed. If you have any questions about this action, please contact customer service at 1-877-768-2265.'
              : 'If you have any questions, please contact customer service at 1-877-768-2265.'}
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
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
      timestamp: new Date().toLocaleString(),
    };

    // Try to find a security alert template
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

    // Fallback to default template
    const subject = `Security Alert - ${alertType}`;
    
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Santander Bank Security Alert</h1>
        </div>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #fecaca;">
          <h2 style="color: #dc2626; margin: 0 0 20px 0;">Security Alert: ${alertType}</h2>
          
          <p style="color: #374151; margin: 0 0 15px 0;">
            <strong>We've detected unusual activity on your account.</strong>
          </p>
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #6b7280;"><strong>Alert Details:</strong> ${details}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #dcfdf7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669;">
            <p style="margin: 0; color: #065f46; font-weight: bold;">What to do:</p>
            <ul style="color: #065f46; margin: 10px 0 0 20px;">
              <li>Review your recent account activity</li>
              <li>Contact us immediately if you notice unauthorized transactions</li>
              <li>Consider changing your password and security questions</li>
            </ul>
          </div>
          
          <p style="color: #374151; margin: 20px 0 0 0;">
            <strong>Contact us immediately at 1-877-768-2265 if you did not authorize this activity.</strong>
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
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
    const subject = `Account ${changeType === 'credit' ? 'Credit' : 'Debit'} - $${amount}`;
    
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #EC0000; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Santander Bank</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin: 0 0 20px 0;">Account Activity</h2>
          
          <p style="color: #374151; margin: 0 0 15px 0;">
            A ${changeType} of <strong>$${amount}</strong> has been applied to your account.
          </p>
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280;"><strong>Account:</strong> ${accountNumber}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Amount:</strong> $${amount}</p>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Description:</strong> ${description}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>New Balance:</strong> $${newBalance}</p>
          </div>
          
          <p style="color: #374151; margin: 20px 0 0 0;">
            Thank you for banking with Santander.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      userId,
    });
  }

  async sendCustomEmail(
    userEmail: string,
    userId: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #EC0000; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Santander Bank</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <div style="color: #374151; line-height: 1.6;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          
          <p style="color: #374151; margin: 20px 0 0 0;">
            Best regards,<br>
            Santander Bank Team
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      userId,
    });
  }
}

export const emailService = new EmailService();
