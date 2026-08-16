import type { FastifyReply, FastifyRequest } from "fastify";
import { eventService } from "../services/event.js";

// NotFoundError などのドメインエラーは投げっぱなしにして、
// ステータスコードへの変換は app.ts のエラーハンドラにまとめている。

type EventParams = { eventId: number };
type LogParams = { logId: number };
type CreateEventBody = { title: string; amount: number };
type RecordBody = { doneOn: string };
type LogsQuery = { from?: string; to?: string; limit: number };

export const eventController = {
  async list(request: FastifyRequest) {
    return { events: await eventService.list(request.currentUserId) };
  },

  async create(
    request: FastifyRequest<{ Body: CreateEventBody }>,
    reply: FastifyReply,
  ) {
    const event = await eventService.create({
      userId: request.currentUserId,
      ...request.body,
    });
    return reply.code(201).send({ event });
  },

  async remove(
    request: FastifyRequest<{ Params: EventParams }>,
    reply: FastifyReply,
  ) {
    await eventService.remove(request.currentUserId, request.params.eventId);
    return reply.code(204).send();
  },

  async record(
    request: FastifyRequest<{ Params: EventParams; Body: RecordBody }>,
    reply: FastifyReply,
  ) {
    const log = await eventService.record(
      request.currentUserId,
      request.params.eventId,
      request.body.doneOn,
    );
    return reply.code(201).send({ log });
  },

  async removeLog(
    request: FastifyRequest<{ Params: LogParams }>,
    reply: FastifyReply,
  ) {
    await eventService.removeLog(request.currentUserId, request.params.logId);
    return reply.code(204).send();
  },

  async balance(request: FastifyRequest) {
    return { balance: await eventService.balance(request.currentUserId) };
  },

  async logs(request: FastifyRequest<{ Querystring: LogsQuery }>) {
    return { logs: await eventService.logs(request.currentUserId, request.query) };
  },
};
