import axios from 'axios';
import { env } from '../../config/env';

/**
 * Formats a phone number for the WhatsApp API.
 * Ensures Indian numbers have the country code prefix '91' and no '+' or spaces.
 */
export const formatWhatsappPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }
  return cleaned;
};

/**
 * Sends an OTP via the WhatsApp Business Cloud API.
 * Uses the configured WhatsApp templates and credentials.
 */
export const sendWhatsappOtp = async (phone: string, otp: string): Promise<any> => {
  const formattedPhone = formatWhatsappPhone(phone);

  const data = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: env.WHATSAPP_TEMPLATE_NAME,
      language: {
        code: 'en',
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: otp,
            },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: otp,
            },
          ],
        },
      ],
    },
  };

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://graph.facebook.com/v23.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
    },
    data: data,
  };

  const response = await axios.request(config);
  return response.data;
};
