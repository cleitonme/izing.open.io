import { initWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import { logger } from "../../utils/logger";
import AppError from "../../errors/AppError";
import { StartTbotSession } from "../TbotServices/StartTbotSession";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp
): Promise<void> => {
  await whatsapp.update({ status: "OPENING" });

  const io = getIO();
  io.emit(`${whatsapp.tenantId}:whatsappSession`, {
    action: "update",
    session: whatsapp
  });

  try {
    if (whatsapp.type === "whatsapp") {
      const wbot = await initWbot(whatsapp);
      wbotMessageListener(wbot);
      wbotMonitor(wbot, whatsapp);
    }

    if (whatsapp.type === "telegram") {
      StartTbotSession(whatsapp);
    }

  } catch (err) {
    logger.error(`StartWhatsAppSession | Error: ${err}`);
    throw new AppError("ERR_START_SESSION", 404);
  }
};
