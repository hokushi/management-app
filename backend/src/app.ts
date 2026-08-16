import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health.js";
import { userRoutes } from "./routes/user.js";
import { eventRoutes } from "./routes/event.js";
import { withCurrentUser } from "./middleware/currentUser.js";
import { EmailAlreadyExistsError, NotFoundError } from "./errors.js";
import { env, isProd } from "./config/env.js";

// ドメインエラーと HTTP ステータスの対応。
// controller ごとに try/catch を書くと同じ変換が散らばるのでここに集める。
const ERROR_STATUS: [new (...args: never[]) => Error, number][] = [
  [NotFoundError, 404],
  [EmailAlreadyExistsError, 409],
];

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  // CORS の許可オリジンを「本番 / ローカル」で切り替える。
  // - 本番 (NODE_ENV === "production"): CORS_ORIGIN に指定したオリジンだけ許可
  //   例: CORS_ORIGIN=https://example.com,https://www.example.com
  // - ローカル開発: すべて許可
  const corsOrigin = isProd
    ? env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(",").map((o) => o.trim())
      : false
    : true;

  app.register(cors, {
    origin: corsOrigin,
    // httpOnly Cookie をやり取りするため資格情報を許可する
    credentials: true,
  });

  // エラーのレスポンス形式を { error: string } に統一する。
  // Fastify の既定は検証エラーが { error: "Bad Request", message: "詳細" }、
  // 自前のエラーが { error: "詳細" } と二重になり、呼び出し側が
  // どちらを読めばいいか分からなくなるため。
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({ error: error.message });
    }

    const domain = ERROR_STATUS.find(([type]) => error instanceof type);
    if (domain) {
      return reply.code(domain[1]).send({ error: error.message });
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error(error);
      // 内部エラーの詳細は外に出さない
      return reply.code(statusCode).send({ error: "サーバーエラーが発生しました" });
    }

    return reply.code(statusCode).send({ error: error.message });
  });

  // --- 公開ルート（認証不要） ---
  app.get("/", async () => {
    return { service: "management-app backend", health: "/health" };
  });

  app.register(healthRoutes);
  // ログイン機能はまだ無いので、ユーザー作成は公開ルートに置いている。
  app.register(userRoutes);

  // --- ユーザーに紐づくルート ---
  // このスコープ内は X-User-Id で「誰のデータか」を決める。
  // 認証を入れるときは withCurrentUser をトークン検証に差し替える。
  app.register(async (userScopedRoutes) => {
    userScopedRoutes.addHook("preHandler", withCurrentUser);

    await userScopedRoutes.register(eventRoutes);
  });

  return app;
}
