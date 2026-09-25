import { IEmailProvider, MailjetConfig, MailjetOptions } from './email.interface';
import Mailjet from 'node-mailjet';

export class MailjetProvider implements IEmailProvider {
  private client: Mailjet;
  private fromEmail: string;
  private fromName: string;
  constructor(config: MailjetConfig) {
    this.client = new Mailjet({ apiKey: config.apiKey, apiSecret: config.apiSecret });
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  send = async (options: MailjetOptions) => {
    await this.client.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: { Email: this.fromEmail, Name: this.fromName },
          To: [{ Email: options.email }],
          Subject: options.subject,
          HTMLPart: options.html,
        },
      ],
    });
  };
}
