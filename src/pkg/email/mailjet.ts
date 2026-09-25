import { IEmailProvider, MailjetConfig, MailjetOptions } from './email.interface';
import Mailjet from 'node-mailjet';

export class MailjetProvider implements IEmailProvider {
  private readonly client: Mailjet;
  private readonly fromEmail: string;
  private readonly fromName: string;
  constructor(config: MailjetConfig) {
    this.client = Mailjet.apiConnect(config.apiKey, config.apiSecret);
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
