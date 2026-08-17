import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
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
//
// kind:
//   "fixed"  … 毎回 amount ちょうど。
//   "streak" … 記録するたびに amount ずつ積み上がる。
//              1回目 +amount、2回目 +amount*2、3回目 +amount*3…。
//              自分を対象にしたリセットイベントを記録すると振り出しに戻る。
//              日を飛ばしても積み上げは維持されるので、数えるのは日数ではなく回数。
export const events = pgTable(
  "events",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    amount: integer("amount").notNull(),
    kind: text("kind").notNull().default("fixed"),
    // 記録すると、この streak イベントを振り出しに戻す（例: ギャンブル → 散歩）。
    // null なら何もリセットしない。1つのリセットが戻すのは1つだけだが、
    // 同じ streak に向けたリセットイベントは何個でも作れる。
    resetsEventId: bigint("resets_event_id", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("events_kind_check", sql`${table.kind} in ('fixed', 'streak')`),
  ],
);

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
    // 元のイベントの resetsEventId を写して持つ（外部キーは張らない）。
    // イベントを消しても「この日にどの積み上げがリセットされたか」は
    // 残す必要があり、消えると過去の計算が変わってしまうため。
    resetsEventId: bigint("resets_event_id", { mode: "number" }),
    // 「どの日にやったか」は日付であって時刻ではない。
    // timestamp で持つとタイムゾーン次第で前日/翌日に寄ってしまい、
    // カレンダーのどのマスに出すかが環境で変わる。date なら曖昧さが無い。
    // 既定値は置かない。UTC の current_date だと日本時間の深夜にズレるので、
    // 常に呼び出し側が「その人にとっての日付」を明示して渡す。
    doneOn: date("done_on").notNull(),
  },
  // 残高も履歴も「あるユーザーの分」を引くので、user_id に索引を張る
  (table) => [index("event_logs_user_id_idx").on(table.userId)],
);
