import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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

// events: 「やること」のテンプレート。日付は持たない。
// 例:「ジムに行く +500」「コンビニ -300」。やるたびに event_logs が1件増える。
// amount は円。正なら使える金額が増え、負なら減る。
export const events = pgTable("events", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// event_logs:「やった」記録。使える金額はこのテーブルの amount の合計。
//
// title と amount はイベントから写して持つ（参照しない）。
// 後からイベントの金額を変えたり消したりしても、過去の記録と残高が
// 勝手に変わらないようにするため。同じ理由で event_id は削除時に
// NULL にするだけで、履歴の行自体は残す。
export const eventLogs = pgTable(
  "event_logs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: bigint("event_id", { mode: "number" }).references(
      () => events.id,
      { onDelete: "set null" },
    ),
    title: text("title").notNull(),
    amount: integer("amount").notNull(),
    doneAt: timestamp("done_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // 残高も履歴も「あるユーザーの分」を引くので、user_id に索引を張る
  (table) => [index("event_logs_user_id_idx").on(table.userId)],
);
