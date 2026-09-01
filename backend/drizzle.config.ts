import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// ローカル(ホスト)で drizzle-kit を実行するときは .env.local を読み込む。
// docker では compose の environment: が DATABASE_URL を渡す。
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("環境変数 DATABASE_URL が設定されていません");
}

export default defineConfig({
  schema: "./src/infrastructure/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url },
});
