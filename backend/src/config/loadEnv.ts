import { existsSync } from "node:fs";

// ローカル(ホスト)で直接起動するときだけ .env.local を読み込む。
// docker で起動するときは compose の environment: が環境変数を渡すので、
// このファイルは存在せず（.dockerignore で除外）、読み込みはスキップされる。
const LOCAL_ENV_FILE = ".env.local";
if (existsSync(LOCAL_ENV_FILE)) {
  process.loadEnvFile(LOCAL_ENV_FILE);
}

/** 環境変数を取得する。未設定なら起動時にエラーで落とす（フォールバックしない）。 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`環境変数 ${name} が設定されていません`);
  }
  return value;
}
