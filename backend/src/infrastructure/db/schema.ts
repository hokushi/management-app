import { bigint, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// ============================================================
// management-app スキーマ（あるべき完成形をここに宣言する）
// ここを書き換えて `pnpm db:push` すると、ツールが差分を計算して
// DB に当てる（既存データは消えない）。
// ============================================================

// users: 利用者。
// パスワードは平文では持たず bcrypt のハッシュだけを保存する
// （DB を覗かれても元のパスワードは復元できない）。
// ログイン機能はまだ無いが、後から足すときにここを作り直さずに済む。
export const users = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
