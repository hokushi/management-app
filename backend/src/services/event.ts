import {
  eventLogRepository,
  eventRepository,
  type Event,
  type EventLog,
  type LogFilter,
} from "../infrastructure/repositories/event.js";
import { InvalidInputError } from "../errors.js";

/**
 * 一覧に「その日に記録したらいくらになるか」を添えたもの。
 * fixed はいつでも amount ちょうど。streak は積み上がり具合で変わる。
 * nextAmount が null のときはその日には記録できない
 * （積み上がるイベントは1日1回まで）。
 */
export type EventWithNextAmount = Event & { nextAmount: number | null };

export const eventService = {
  async list(userId: number, on?: string): Promise<EventWithNextAmount[]> {
    const events = await eventRepository.listByUser(userId);
    if (!on) {
      return events.map((event) => ({ ...event, nextAmount: null }));
    }

    assertRealDate(on);
    return Promise.all(
      events.map(async (event) => ({
        ...event,
        nextAmount: await nextAmountFor(userId, event, on),
      })),
    );
  },

  async create(input: {
    userId: number;
    title: string;
    amount: number;
    kind: Event["kind"];
    resetsEventId: number | null;
  }): Promise<Event> {
    if (input.resetsEventId !== null) {
      await assertResettableTarget(input.userId, input.resetsEventId);
    }
    return eventRepository.create({ ...input, title: input.title.trim() });
  },

  async remove(userId: number, eventId: number): Promise<void> {
    return eventRepository.remove(eventId, userId);
  },

  /**
   * イベントを「やった」ことにして記録を1件足す。
   * 金額とタイトルはイベントから写して保存するので、あとでイベントを直しても
   * この記録は変わらない。streak の場合は積み上がった額を計算して写す。
   */
  async record(
    userId: number,
    eventId: number,
    doneOn: string,
  ): Promise<EventLog> {
    assertRealDate(doneOn);
    const event = await eventRepository.findByIdForUser(eventId, userId);
    const amount = await nextAmountFor(userId, event, doneOn);

    if (amount === null) {
      throw new InvalidInputError("このイベントはこの日すでに記録しています");
    }

    return eventLogRepository.create({
      userId,
      eventId: event.id,
      title: event.title,
      amount,
      resetsEventId: event.resetsEventId,
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
 * その日に記録したらいくらになるか。記録できない日なら null。
 *
 * streak は「自分を対象にした直近のリセットより後、その日より前」に
 * 何回記録したかで決まる。対象の日より前だけを数えるので、過去の日に付けても
 * その日時点であるべきだった額になる。
 *
 * 同じ日に2回目は記録させない。数えるのがその日より前の分だけである以上、
 * 2回押すと同じ額がもう一度入ってしまい、1日分の増え方が狂うため
 * （「1日目・2日目…」という数え方そのものが崩れる）。
 */
async function nextAmountFor(
  userId: number,
  event: Event,
  on: string,
): Promise<number | null> {
  if (event.kind !== "streak") return event.amount;
  if (await eventLogRepository.hasLogOn(userId, event.id, on)) return null;

  const lastReset = await eventLogRepository.lastResetBefore(
    userId,
    event.id,
    on,
  );
  const done = await eventLogRepository.countForStreak(
    userId,
    event.id,
    lastReset,
    on,
  );
  return event.amount * (done + 1);
}

/** リセットの相手は、自分以外の・自分が持っている・積み上がるイベントに限る。 */
async function assertResettableTarget(
  userId: number,
  targetId: number,
): Promise<void> {
  const target = await eventRepository.findByIdForUser(targetId, userId);
  if (target.kind !== "streak") {
    throw new InvalidInputError(
      "リセットの相手には、やるたびに増えるイベントを選んでください",
    );
  }
}

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
