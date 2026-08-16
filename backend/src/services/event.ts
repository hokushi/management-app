import {
  eventLogRepository,
  eventRepository,
  type Event,
  type EventLog,
} from "../infrastructure/repositories/event.js";

// 履歴は「最近どれくらい使ったか」を見るためのものなので、全件は返さない
const LOG_LIMIT = 50;

export type Summary = {
  /** 使える金額。記録の合計。 */
  balance: number;
  logs: EventLog[];
};

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
  async record(userId: number, eventId: number): Promise<EventLog> {
    const event = await eventRepository.findByIdForUser(eventId, userId);
    return eventLogRepository.create({
      userId,
      eventId: event.id,
      title: event.title,
      amount: event.amount,
    });
  },

  /** 記録を取り消す。押し間違いを戻せるようにするため。 */
  async removeLog(userId: number, logId: number): Promise<void> {
    return eventLogRepository.removeById(logId, userId);
  },

  async summary(userId: number): Promise<Summary> {
    const [balance, logs] = await Promise.all([
      eventLogRepository.sumByUser(userId),
      eventLogRepository.listByUser(userId, LOG_LIMIT),
    ]);
    return { balance, logs };
  },
};
