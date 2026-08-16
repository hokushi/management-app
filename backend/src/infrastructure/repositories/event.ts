import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { eventLogs, events } from "../db/schema.js";
import { NotFoundError } from "../../errors.js";

export type Event = {
  id: number;
  title: string;
  amount: number;
  createdAt: Date;
};

export type EventLog = {
  id: number;
  eventId: number | null;
  title: string;
  amount: number;
  doneAt: Date;
};

export type NewEvent = {
  userId: number;
  title: string;
  amount: number;
};

const eventColumns = {
  id: events.id,
  title: events.title,
  amount: events.amount,
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

export const eventLogRepository = {
  /** 「やった」記録を1件足す。金額とタイトルは記録時点の値を写して保存する。 */
  async create(input: {
    userId: number;
    eventId: number;
    title: string;
    amount: number;
  }): Promise<EventLog> {
    const rows = await db.insert(eventLogs).values(input).returning({
      id: eventLogs.id,
      eventId: eventLogs.eventId,
      title: eventLogs.title,
      amount: eventLogs.amount,
      doneAt: eventLogs.doneAt,
    });
    return rows[0]!;
  },

  async listByUser(userId: number, limit: number): Promise<EventLog[]> {
    return db
      .select({
        id: eventLogs.id,
        eventId: eventLogs.eventId,
        title: eventLogs.title,
        amount: eventLogs.amount,
        doneAt: eventLogs.doneAt,
      })
      .from(eventLogs)
      .where(eq(eventLogs.userId, userId))
      .orderBy(desc(eventLogs.doneAt), desc(eventLogs.id))
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

  async removeById(id: number, userId: number): Promise<void> {
    const rows = await db
      .delete(eventLogs)
      .where(and(eq(eventLogs.id, id), eq(eventLogs.userId, userId)))
      .returning({ id: eventLogs.id });

    if (rows.length === 0) throw new NotFoundError("記録が見つかりません");
  },
};
