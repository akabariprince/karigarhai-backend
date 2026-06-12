import { WhatsappService } from '../modules/whatsapp/whatsapp.service';

const whatsappService = new WhatsappService();

async function main() {
  console.log('--- CALLING markConversationAsRead("+916359557449") ---');
  const result = await whatsappService.markConversationAsRead('+916359557449');
  console.log('Result:', result);
}

main()
  .catch(e => console.error(e));
