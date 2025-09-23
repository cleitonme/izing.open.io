import {
  Client,
  Reaction as WbotReaction
} from "whatsapp-web.js";
import { logger } from "../../../utils/logger";
import Message from "../../../models/Message";
import Ticket from "../../../models/Ticket";
import Contact from "../../../models/Contact";
import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";
import Queue from "../../../libs/Queue";
import Setting from "../../../models/Setting";
import CreateMessageService from "../../MessageServices/CreateMessageService";

interface Session extends Client {
  id: number;
}

const HandleReaction = async (
  reaction: WbotReaction,
  wbot: Session
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    (async () => {
      try {
        const whatsapp = await ShowWhatsAppService({ id: wbot.id });
        const { tenantId } = whatsapp;

        const originalMessageId = reaction.msgId.id;

        const originalMessage = await Message.findOne({
          where: {
            messageId: originalMessageId,
            tenantId
          },
          include: [
            {
              model: Ticket,
              as: "ticket",
              where: { tenantId }
            }
          ]
        });

        if (!originalMessage) {
          logger.info(`Message not found for reaction to message ID: ${originalMessageId}`);
          resolve();
          return;
        }

        const ticket = originalMessage.ticket;

        let contactId: number | undefined = undefined;
        if (!reaction.id.fromMe) {
          const contact = await Contact.findOne({
            where: { number: reaction.senderId.split('@')[0], tenantId }
          });
          contactId = contact?.id;
        }

        const timestampAsInteger = Math.floor(reaction.timestamp);

        const messageData = {
          messageId: reaction.id.id,
          ticketId: ticket.id,
          contactId: contactId,
          body: reaction.reaction,
          fromMe: reaction.id.fromMe,
          mediaType: "reaction",
          read: reaction.id.fromMe,
          quotedMsgId: originalMessage.id,
          timestamp: timestampAsInteger,
          status: "received"
        };

        await CreateMessageService({ messageData, tenantId });

        await ticket.update({
          lastMessageAt: new Date().getTime()
        });

        const apiConfig: any = ticket.apiConfig || {};
        if (
          !reaction.id.fromMe &&
          !ticket.isGroup &&
          apiConfig?.externalKey &&
          apiConfig?.urlMessageStatus
        ) {
          const payload = {
            timestamp: Date.now(),
            reaction,
            reactionId: reaction.id.id,
            originalMessageId,
            ticketId: ticket.id,
            externalKey: apiConfig?.externalKey,
            authToken: apiConfig?.authToken,
            type: "hookReaction"
          };
          Queue.add("WebHooksAPI", {
            url: apiConfig.urlMessageStatus,
            type: payload.type,
            payload
          });
        }

        resolve();
      } catch (err) {
        logger.error(err);
        reject(err);
      }
    })();
  });
};

export default HandleReaction;
