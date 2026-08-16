import type { FastifyReply, FastifyRequest } from "fastify";
import { healthService } from "../services/health.js";

export const healthController = {
  /** プロセスが生きているかだけを返す（DB は見ない）。 */
  async liveness() {
    return { status: "ok" };
  },

  /** DB まで含めて疎通確認する。落ちていれば 503 を返す。 */
  async readiness(request: FastifyRequest, reply: FastifyReply) {
    try {
      await healthService.checkDatabase();
      return { status: "ok", database: "ok" };
    } catch (err) {
      request.log.error(err, "DB への疎通確認に失敗しました");
      return reply.code(503).send({ status: "error", database: "error" });
    }
  },
};
