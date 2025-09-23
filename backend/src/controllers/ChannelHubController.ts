import { Request, Response } from "express";
import CreateChannelsService from "../services/WbotNotificame/CreateChannelsService";
import { getIO } from "../libs/socket";
import ListChannels from "../services/WbotNotificame/ListChannels";
import { setChannelWebhook } from "../helpers/SetChannelWebhook";

export interface IChannel {
  name: string;
  status?: string;
  isDefault?: boolean;
  tenantId: string | number;
  type: string;
  profilePic?: string;
  phone?: any;
  number?: any;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { channels = [] } = req.body;
  const tenantId = Number(req.user.tenantId);

  const { whatsapps } = await CreateChannelsService({
    tenantId,
    channels
  });

  whatsapps.forEach(whatsapp => {
    setTimeout(() => {
      const whatsappChannel: IChannel = {
        name: whatsapp.name,
        status: whatsapp.status,
        isDefault: whatsapp.isDefault,
        tenantId: whatsapp.tenantId,
        type: whatsapp.type,
        phone: whatsapp.phone,
        number: whatsapp.number
      };
      setChannelWebhook(whatsappChannel, whatsapp.id.toString());
    }, 2000);
  });

  const io = getIO();

  whatsapps.forEach(whatsapp => {
    io.emit(`${tenantId}:whatsapp`, {
      action: "update",
      whatsapp
    });
  });

  return res.status(200).json(whatsapps);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  try {
    const channels = await ListChannels(tenantId.toString());
    return res.status(200).json(channels);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
