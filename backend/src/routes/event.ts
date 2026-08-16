import type { FastifyInstance } from "fastify";
import { eventController } from "../controllers/event.js";

// 金額の上限。円単位の整数で持つ。
// 極端な値を弾いておくと、合計が桁あふれする心配をしなくて済む。
const MAX_AMOUNT = 10_000_000;

const createEventBodySchema = {
  type: "object",
  required: ["title", "amount"],
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 50 },
    // 正なら使える金額が増え、負なら減る。0 は記録しても意味が無いので弾く。
    amount: {
      type: "integer",
      minimum: -MAX_AMOUNT,
      maximum: MAX_AMOUNT,
      not: { const: 0 },
    },
  },
} as const;

// URL の :eventId / :logId は文字列で来るので integer に型強制する
const eventParamsSchema = {
  type: "object",
  required: ["eventId"],
  properties: { eventId: { type: "integer" } },
} as const;

const logParamsSchema = {
  type: "object",
  required: ["logId"],
  properties: { logId: { type: "integer" } },
} as const;

export async function eventRoutes(app: FastifyInstance) {
  // 呼び出し側のスコープで withCurrentUser が適用されている前提
  app.get("/events", eventController.list);

  app.post(
    "/events",
    { schema: { body: createEventBodySchema } },
    eventController.create,
  );

  app.delete(
    "/events/:eventId",
    { schema: { params: eventParamsSchema } },
    eventController.remove,
  );

  // イベントを「やった」ことにして記録を1件足す
  app.post(
    "/events/:eventId/logs",
    { schema: { params: eventParamsSchema } },
    eventController.record,
  );

  // 押し間違いを戻す
  app.delete(
    "/logs/:logId",
    { schema: { params: logParamsSchema } },
    eventController.removeLog,
  );

  // 使える金額と最近の記録
  app.get("/summary", eventController.summary);
}
