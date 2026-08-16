import type { FastifyReply, FastifyRequest } from "fastify";
import { userService, type CreateUserInput } from "../services/user.js";
import { EmailAlreadyExistsError } from "../errors.js";

export const userController = {
  async create(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply,
  ) {
    try {
      const user = await userService.create(request.body);
      return reply.code(201).send({ user });
    } catch (err) {
      if (err instanceof EmailAlreadyExistsError) {
        return reply.code(409).send({ error: err.message });
      }
      throw err;
    }
  },
};
