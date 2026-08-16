import type { FastifyInstance } from "fastify";
import { eventController } from "../controllers/event.js";

// 金額の上限。円単位の整数で持つ。
// 極端な値を弾いておくと、合計が桁あふれする心配をしなくて済む。
const MAX_AMOUNT = 10_000_000;

// YYYY-MM-DD。実在する日付かどうかまでは見ず、形だけ確認する
// （2月30日のような値は Postgres の date 型が弾く）。
const DATE_PATTERN = "^\\d{4}-\\d{2}-\\d{2}$";

const createEventBodySchema = {
  type: "object",
  required: ["title", "amount"],
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 50 },
    // 正なら使える金額が増え、負なら減る。0 は記録しても意味が無いので弾く。
    // kind が "streak" のときは1回あたりの増え幅として使う。
    amount: {
      type: "integer",
      minimum: -MAX_AMOUNT,
      maximum: MAX_AMOUNT,
      not: { const: 0 },
    },
    kind: { type: "string", enum: ["fixed", "streak"], default: "fixed" },
    resetsStreak: { type: "boolean", default: false },
  },
} as const;

const eventsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    // 指定するとその日に記録した場合の金額（nextAmount）が付く
    on: { type: "string", pattern: DATE_PATTERN },
  },
} as const;

// 「いつやったか」は必須。既定値をサーバー側で決めると、
// どのタイムゾーンの「今日」なのかが曖昧になるため呼び出し側に決めさせる。
const recordBodySchema = {
  type: "object",
  required: ["doneOn"],
  additionalProperties: false,
  properties: {
    doneOn: { type: "string", pattern: DATE_PATTERN },
  },
} as const;

const logsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    from: { type: "string", pattern: DATE_PATTERN },
    to: { type: "string", pattern: DATE_PATTERN },
    limit: { type: "integer", minimum: 1, maximum: 500, default: 50 },
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
  app.get(
    "/events",
    { schema: { querystring: eventsQuerySchema } },
    eventController.list,
  );

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
    { schema: { params: eventParamsSchema, body: recordBodySchema } },
    eventController.record,
  );

  // 押し間違いを戻す
  app.delete(
    "/logs/:logId",
    { schema: { params: logParamsSchema } },
    eventController.removeLog,
  );

  // 記録の一覧。from / to で期間を絞れる（カレンダーは表示中の月だけ引く）。
  app.get(
    "/logs",
    { schema: { querystring: logsQuerySchema } },
    eventController.logs,
  );

  // 使える金額（全期間の合計）
  app.get("/balance", eventController.balance);
}
