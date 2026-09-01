import type { FastifyReply, FastifyRequest } from "fastify";
import "../types/fastify.js";

/**
 * リクエストがどのユーザーのものかを X-User-Id ヘッダーから読む。
 *
 * ログインが無いうちの仮の仕組み。ヘッダーは呼び出し側が自由に名乗れるので
 * 認証にはならない（他人の ID を書けば他人のデータが見える）。
 * 認証を入れるときは、この preHandler をトークン検証に差し替える。
 */
export async function withCurrentUser(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const raw = request.headers["x-user-id"];
  const userId = Number(Array.isArray(raw) ? raw[0] : raw);

  if (!Number.isInteger(userId) || userId <= 0) {
    return reply.code(400).send({ error: "X-User-Id ヘッダーが必要です" });
  }

  request.currentUserId = userId;
}
