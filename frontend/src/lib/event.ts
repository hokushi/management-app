// イベント関連で server / client の両方から参照する型とフォーマット。

/** 「やること」のテンプレート。日付は持たない。 */
export type Event = {
  id: number;
  title: string;
  /** 円。正なら使える金額が増え、負なら減る。 */
  amount: number;
  createdAt: string;
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
