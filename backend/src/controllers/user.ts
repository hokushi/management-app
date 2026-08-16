import type { FastifyReply, FastifyRequest } from "fastify";
import { userService, type CreateUserInput } from "../services/user.js";

// ドメインエラーからステータスコードへの変換は app.ts のエラーハンドラで行う。

export const userController = {
  async list() {
    return { users: await userService.list() };
  },

  async create(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply,
  ) {
    const user = await userService.create(request.body);
    return reply.code(201).send({ user });
  },
};
