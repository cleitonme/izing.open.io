import { getTbot } from "../libs/tbot";
import TelegramSendMessagesSystem from "../services/TbotServices/TelegramSendMessagesSystem";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";

type Payload = {
  ticket: any;
  messageData: any;
  media: any;
  userId: any;
};

const SendMessageSystemProxy = async ({
  ticket,
  messageData,
  media,
  userId
}: Payload): Promise<any> => {
  let message;

  if (messageData.mediaName) {
    switch (ticket.channel) {

      case "telegram":
        message = await TelegramSendMessagesSystem(
          getTbot(ticket.whatsappId),
          ticket,
          { ...messageData, media }
        );
        break;

      default:
        message = await SendWhatsAppMedia({ media, ticket, userId });
        break;
    }
  }

  if (!media) {
    switch (ticket.channel) {

      case "telegram":
        message = await TelegramSendMessagesSystem(
          getTbot(ticket.whatsappId),
          ticket,
          messageData
        );
        break;

      default:
        message = await SendWhatsAppMessage({
          body: messageData.body,
          ticket,
          quotedMsg: messageData?.quotedMsg
        });
        break;
    }
  }

  return message;
};

export default SendMessageSystemProxy;
