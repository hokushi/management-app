import { and, desc, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { eventLogs, events } from "../db/schema.js";
import { NotFoundError } from "../../errors.js";

/** "fixed" は毎回同額、"streak" は記録するたびに amount ずつ積み上がる。 */
export type EventKind = "fixed" | "streak";

export type Event = {
  id: number;
  title: string;
  amount: number;
  kind: EventKind;
  resetsStreak: boolean;
  createdAt: Date;
};

export type EventLog = {
  id: number;
  eventId: number | null;
  title: string;
  amount: number;
  /** YYYY-MM-DD。時刻は持たない。 */
  doneOn: string;
};

export type LogFilter = {
  /** YYYY-MM-DD。この日を含む。 */
  from?: string;
  /** YYYY-MM-DD。この日を含む。 */
  to?: string;
  limit: number;
};

export type NewEvent = {
  userId: number;
  title: string;
  amount: number;
  kind: EventKind;
  resetsStreak: boolean;
};

const eventColumns = {
  id: events.id,
  title: events.title,
  amount: events.amount,
  kind: sql<EventKind>`${events.kind}`.as("kind"),
  resetsStreak: events.resetsStreak,
  createdAt: events.createdAt,
};

export const eventRepository = {
  async listByUser(userId: number): Promise<Event[]> {
    return db
      .select(eventColumns)
      .from(events)
      .where(eq(events.userId, userId))
      .orderBy(events.id);
  },

  async create(input: NewEvent): Promise<Event> {
    const rows = await db.insert(events).values(input).returning(eventColumns);
    return rows[0]!;
  },

  /**
   * 自分のイベントを1件取る。
   * 他人のイベントは「無い」と同じ扱いにして、存在の有無を漏らさない。
   */
  async findByIdForUser(id: number, userId: number): Promise<Event> {
    const rows = await db
      .select(eventColumns)
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));

    const event = rows[0];
    if (!event) throw new NotFoundError("イベントが見つかりません");
    return event;
  },

  async remove(id: number, userId: number): Promise<void> {
    const rows = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning({ id: events.id });

    if (rows.length === 0) throw new NotFoundError("イベントが見つかりません");
  },
};

const logColumns = {
  id: eventLogs.id,
  eventId: eventLogs.eventId,
  title: eventLogs.title,
  amount: eventLogs.amount,
  doneOn: eventLogs.doneOn,
};

export const eventLogRepository = {
  /** 「やった」記録を1件足す。金額とタイトルは記録時点の値を写して保存する。 */
  async create(input: {
    userId: number;
    eventId: number;
    title: string;
    amount: number;
    resetsStreak: boolean;
    doneOn: string;
  }): Promise<EventLog> {
    const rows = await db.insert(eventLogs).values(input).returning(logColumns);
    return rows[0]!;
  },

  async listByUser(
    userId: number,
    { from, to, limit }: LogFilter,
  ): Promise<EventLog[]> {
    return db
      .select(logColumns)
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.userId, userId),
          from ? gte(eventLogs.doneOn, from) : undefined,
          to ? lte(eventLogs.doneOn, to) : undefined,
        ),
      )
      .orderBy(desc(eventLogs.doneOn), desc(eventLogs.id))
      .limit(limit);
  },

  /** 使える金額 = 記録の合計。1件も無ければ 0。 */
  async sumByUser(userId: number): Promise<number> {
    const rows = await db
      .select({
        // SUM は行が無いと NULL を返すので 0 に寄せる。
        // bigint で返るドライバもあるため、いったん文字列で受けて数値にする。
        total: sql<string>`coalesce(sum(${eventLogs.amount}), 0)`,
      })
      .from(eventLogs)
      .where(eq(eventLogs.userId, userId));

    return Number(rows[0]?.total ?? 0);
  },

  /**
   * その日より前で、いちばん最近リセットが起きた日。1度も無ければ null。
   * streak を「どこから数え直すか」の起点になる。
   */
  async lastResetBefore(userId: number, date: string): Promise<string | null> {
    const rows = await db
      .select({ doneOn: sql<string | null>`max(${eventLogs.doneOn})` })
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.userId, userId),
          eq(eventLogs.resetsStreak, true),
          lt(eventLogs.doneOn, date),
        ),
      );
    return rows[0]?.doneOn ?? null;
  },

  /** そのイベントをその日にもう記録しているか。 */
  async hasLogOn(
    userId: number,
    eventId: number,
    date: string,
  ): Promise<boolean> {
    const rows = await db
      .select({ id: eventLogs.id })
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.userId, userId),
          eq(eventLogs.eventId, eventId),
          eq(eventLogs.doneOn, date),
        ),
      )
      .limit(1);
    return rows.length > 0;
  },

  /** その日にリセットのイベントを記録しているか。 */
  async hasResetOn(userId: number, date: string): Promise<boolean> {
    const rows = await db
      .select({ id: eventLogs.id })
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.userId, userId),
          eq(eventLogs.resetsStreak, true),
          eq(eventLogs.doneOn, date),
        ),
      )
      .limit(1);
    return rows.length > 0;
  },

  /**
   * あるイベントを、リセット以降・その日より前に何回記録したか。
   * これが streak の「何回目か」になる（日数ではなく回数で数える。
   * 日を飛ばしても積み上げは維持される仕様のため）。
   */
  async countForStreak(
    userId: number,
    eventId: number,
    after: string | null,
    before: string,
  ): Promise<number> {
    const rows = await db
      .select({ count: sql<string>`count(*)` })
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.userId, userId),
          eq(eventLogs.eventId, eventId),
          lt(eventLogs.doneOn, before),
          after ? gt(eventLogs.doneOn, after) : undefined,
        ),
      );
    return Number(rows[0]?.count ?? 0);
  },

  async removeById(id: number, userId: number): Promise<void> {
    const rows = await db
      .delete(eventLogs)
      .where(and(eq(eventLogs.id, id), eq(eventLogs.userId, userId)))
      .returning({ id: eventLogs.id });

    if (rows.length === 0) throw new NotFoundError("記録が見つかりません");
  },
};
