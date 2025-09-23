/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { Request, Response } from "express";
import AppError from "../errors/AppError";
import DeleteMessageSystem from "../helpers/DeleteMessageSystem";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import Message from "../models/Message";
import CreateForwardMessageService from "../services/MessageServices/CreateForwardMessageService";
import CreateMessageSystemService from "../services/MessageServices/CreateMessageSystemService";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import EditWhatsAppMessage from "../services/WbotServices/EditWhatsAppMessage";
import SendWhatsAppReaction from "../services/WbotServices/SendWhatsAppReaction";

type IndexQuery = {
  pageNumber: string;
};

type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  sendType?: string;
  scheduleDate?: string | Date;
  quotedMsg?: Message;
  idFront?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query as IndexQuery;
  const { tenantId } = req.user;

  const { count, messages, messagesOffLine, ticket, hasMore } =
    await ListMessagesService({
      pageNumber,
      ticketId,
      tenantId
    });

  try {
    SetTicketMessagesAsRead(ticket);
  } catch (error) {
    console.log("SetTicketMessagesAsRead", error);
  }

  return res.json({ count, messages, messagesOffLine, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { tenantId, id: userId } = req.user;
  const messageData: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];
  const ticket = await ShowTicketService({ id: ticketId, tenantId });

  try {
    SetTicketMessagesAsRead(ticket);
  } catch (error) {
    console.log("SetTicketMessagesAsRead", error);
  }

  await CreateMessageSystemService({
    msg: messageData,
    tenantId,
    medias,
    ticket,
    userId,
    scheduleDate: messageData.scheduleDate,
    sendType: messageData.sendType || "chat",
    status: "pending",
    idFront: messageData.idFront
  });

  return res.send();
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { tenantId } = req.user;
  try {
    await DeleteMessageSystem(req.body.id, messageId, tenantId);
  } catch (error) {
    console.error("ERR_DELETE_SYSTEM_MSG", error.message);
    throw new AppError("ERR_DELETE_SYSTEM_MSG");
  }

  return res.send();
};

export const forward = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = req.body;
  const { user } = req;

  for (const message of data.messages) {
    await CreateForwardMessageService({
      userId: user.id,
      tenantId: user.tenantId,
      message,
      contact: data.contact,
      ticketIdOrigin: message.ticketId
    });
  }

  return res.send();
};

export const edit = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { tenantId } = req.user;
  const { body }: MessageData = req.body;
  try {
    await EditWhatsAppMessage(req.body.id, messageId, tenantId, body);
  } catch (error) {
    if (error instanceof AppError && error.message === "ERR_EDITING_WAPP_MSG") {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }

  return res.send();
};

export const addReaction = async (req: Request, res: Response): Promise<Response> => {
  try {

    const { messageId, ticketId, reaction } = req.body;

    await SendWhatsAppReaction({
      messageId,
      ticketId,
      reactionType: reaction
    });

    return res.status(200).send({
      message: "Reação adicionada com sucesso!",
      reactions: reaction
    });
  } catch (error) {
    console.error("Erro ao adicionar reação:", error);
    if (error instanceof AppError) {
      return res.status(400).send({ message: error.message });
    }
    return res.status(500).send({ message: "Erro ao adicionar reação", error: error.message });
  }
};
