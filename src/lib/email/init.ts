import { MailjetProvider } from '../../pkg/email/mailjet';
import { env } from '../config/env';

export const EmailProvider = new MailjetProvider({
  apiKey: env.mailjet.apiKey,
  apiSecret: env.mailjet.apiSecret,
  fromEmail: env.mailjet.fromEmail,
  fromName: env.mailjet.fromName,
});
