import { requireEnv } from "./loadEnv.js";

// アプリ全体で使う環境変数をここに集約する。
// 各所で process.env.X ?? "default" と書かず、env.X を参照する。
// フォールバックはせず、未設定なら起動時にエラーで落とす。
export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  PORT: Number(requireEnv("PORT")),
  HOST: requireEnv("HOST"),
  NODE_ENV: requireEnv("NODE_ENV"),
  // 本番(NODE_ENV=production)のときだけ CORS で使う。未設定なら undefined。
  CORS_ORIGIN: process.env.CORS_ORIGIN,
} as const;

export const isProd = env.NODE_ENV === "production";
