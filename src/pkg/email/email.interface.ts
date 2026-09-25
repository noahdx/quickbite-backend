export interface MailjetOptions {
  email: string;
  subject: string;
  html: string;
}

export interface MailjetConfig {
  apiKey: string;
  apiSecret: string;
  fromEmail: string;
  fromName: string;
}

export interface IEmailProvider {
  send(options: MailjetOptions): Promise<void>;
}
