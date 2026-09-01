// イベント関連で server / client の両方から参照する型とフォーマット。

/**
 * "fixed"  … 毎回 amount ちょうど。
 * "streak" … 記録するたびに amount ずつ積み上がる（1回目 +50、2回目 +100…）。
 */
export type EventKind = "fixed" | "streak";

/** 「やること」のテンプレート。日付は持たない。 */
export type Event = {
  id: number;
  title: string;
  /** 円。fixed なら金額そのもの、streak なら1回あたりの増え幅。 */
  amount: number;
  kind: EventKind;
  /**
   * 記録すると、この id の積み上がるイベントを振り出しに戻す（例: ギャンブル → 散歩）。
   * null なら何もリセットしない。効き始めるのは翌日から。
   */
  resetsEventId: number | null;
  createdAt: string;
  /**
   * その日に記録したらいくらになるか。null なら記録できない
   * （積み上がるイベントは1日1回まで）。
   * backend に ?on=YYYY-MM-DD を付けて取得したときだけ入る。
   */
  nextAmount: number | null;
};

/** 「やった」記録。 */
export type EventLog = {
  id: number;
  eventId: number | null;
  title: string;
  amount: number;
  /** YYYY-MM-DD。時刻は持たない。 */
  doneOn: string;
};

/** 記録を日付ごとにまとめる。カレンダーのマスに置くために使う。 */
export function groupLogsByDate(
  logs: EventLog[],
): Record<string, EventLog[]> {
  const grouped: Record<string, EventLog[]> = {};
  for (const log of logs) {
    (grouped[log.doneOn] ??= []).push(log);
  }
  return grouped;
}

/** 記録の合計。週ごとのプラスマイナスを出すのに使う。 */
export function sumAmounts(logs: EventLog[]): number {
  return logs.reduce((total, log) => total + log.amount, 0);
}

/**
 * 3桁ごとにカンマを入れる。
 * toLocaleString は環境によって結果が変わりうる（＝サーバーとブラウザで
 * 食い違ってハイドレーションエラーになりうる）ので自前で組む。
 */
function group(value: number): string {
  return Math.abs(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 残高の表示。例: ¥3,500 / -¥300 */
export function formatYen(amount: number): string {
  return `${amount < 0 ? "-" : ""}¥${group(amount)}`;
}

/** 増減の表示。符号を必ず付ける。例: +¥500 / -¥300 */
export function formatSignedYen(amount: number): string {
  return `${amount < 0 ? "-" : "+"}¥${group(amount)}`;
}

/** 増える金額は緑、減る金額は赤。 */
export function amountClass(amount: number): string {
  return amount < 0
    ? "text-red-600 dark:text-red-400"
    : "text-emerald-600 dark:text-emerald-400";
}
