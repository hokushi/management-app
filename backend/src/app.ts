import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health.js";
import { env, isProd } from "./config/env.js";

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

  // --- 公開ルート（認証不要） ---
  app.get("/", async () => {
    return { service: "management-app backend", health: "/health" };
  });

  app.register(healthRoutes);

  // --- 認証必須ルート ---
  // 認証を入れるときは、このスコープに preHandler フックを付けて
  // 認証が必要なルートをまとめて登録する。
  // app.register(async (protectedRoutes) => {
  //   protectedRoutes.addHook("preHandler", authenticate);
  //   await protectedRoutes.register(userRoutes);
  // });

  return app;
}
