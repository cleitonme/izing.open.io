import { Op } from "sequelize";
// import { initInstaBot } from "../../libs/InstaBot";
import Whatsapp from "../../models/Whatsapp";
import { StartTbotSession } from "../TbotServices/StartTbotSession";
import { StartWhatsAppSession } from "./StartWhatsAppSession";
// import { StartTbotSession } from "../TbotServices/StartTbotSession";

export const StartAllWhatsAppsSessions = async (): Promise<void> => {
  const whatsapps = await Whatsapp.findAll({
    where: {
      [Op.or]: [
        {
          [Op.and]: {
            type: {
              [Op.in]: ["instagram", "telegram", "waba"]
            },
            status: {
              [Op.notIn]: ["DISCONNECTED"]
            }
          }
        },
        {
          [Op.and]: {
            type: "whatsapp"
          },
          status: {
            [Op.notIn]: ["DISCONNECTED", "qrcode"]
            // "DISCONNECTED"
          }
        }
      ],
      isActive: true
    }
  });
  const whatsappSessions = whatsapps.filter(w => w.type === "whatsapp");
  const telegramSessions = whatsapps.filter(
    w => w.type === "telegram" && !!w.tokenTelegram
  );

  if (whatsappSessions.length > 0) {
    whatsappSessions.forEach(whatsapp => {
      StartWhatsAppSession(whatsapp);
    });
  }

  if (telegramSessions.length > 0) {
    telegramSessions.forEach(whatsapp => {
      StartTbotSession(whatsapp);
    });
  }


};
