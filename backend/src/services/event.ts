import {
  eventLogRepository,
  eventRepository,
  type Event,
  type EventLog,
  type LogFilter,
} from "../infrastructure/repositories/event.js";
import { InvalidInputError } from "../errors.js";

export const eventService = {
  async list(userId: number): Promise<Event[]> {
    return eventRepository.listByUser(userId);
  },

  async create(input: {
    userId: number;
    title: string;
    amount: number;
  }): Promise<Event> {
    return eventRepository.create({ ...input, title: input.title.trim() });
  },

  async remove(userId: number, eventId: number): Promise<void> {
    return eventRepository.remove(eventId, userId);
  },

  /**
   * イベントを「やった」ことにして記録を1件足す。
   * 金額はイベントから写して保存するので、あとでイベントを直しても
   * この記録は変わらない。
   */
  async record(
    userId: number,
    eventId: number,
    doneOn: string,
  ): Promise<EventLog> {
    assertRealDate(doneOn);
    const event = await eventRepository.findByIdForUser(eventId, userId);
    return eventLogRepository.create({
      userId,
      eventId: event.id,
      title: event.title,
      amount: event.amount,
      doneOn,
    });
  },

  /** 記録を取り消す。押し間違いを戻せるようにするため。 */
  async removeLog(userId: number, logId: number): Promise<void> {
    return eventLogRepository.removeById(logId, userId);
  },

  /** 使える金額。全期間の合計なので期間で絞らない。 */
  async balance(userId: number): Promise<number> {
    return eventLogRepository.sumByUser(userId);
  },

  async logs(userId: number, filter: LogFilter): Promise<EventLog[]> {
    return eventLogRepository.listByUser(userId, filter);
  },
};

/**
 * YYYY-MM-DD が実在する日付か確かめる。
 * ルートの JSON スキーマは形しか見ないので、2月30日のような値はここで弾く
 * （そのまま INSERT すると Postgres のエラーになり 500 で返ってしまう）。
 */
function assertRealDate(dateKey: string): void {
  // 既定値の 0 は形が壊れているときだけ使われ、その場合は下の判定で弾かれる
  const [year = 0, month = 0, day = 0] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isReal) {
    throw new InvalidInputError(`${dateKey} は存在しない日付です`);
  }
}
