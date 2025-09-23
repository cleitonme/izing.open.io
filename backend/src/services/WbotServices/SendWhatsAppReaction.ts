import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import GetWbotMessage from "../../helpers/GetWbotMessage";

interface ReactionRequest {
  messageId: string;
  ticketId: string;
  reactionType: string;
}

const SendWhatsAppReaction = async ({
                                      messageId,
                                      ticketId,
                                      reactionType
                                    }: ReactionRequest): Promise<any> => {
  try {
    if (!reactionType) {
      throw new AppError("ReactionType not found");
    }

    const ticket = await Ticket.findByPk(ticketId, {
      include: ["contact"]
    });

    if (!ticket) {
      throw new AppError("Ticket not found");
    }

    const targetMessage = await GetWbotMessage(ticket, messageId, 100);

    if (!targetMessage) {
      throw new AppError("Original message not found in chat history");
    }

    await targetMessage.react(reactionType);

    return { success: true };
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_REACTION");
  }
};

export default SendWhatsAppReaction;
