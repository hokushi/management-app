// カレンダーの日付計算。React に依存しない純粋な関数だけを置く。
//
// 日付は "YYYY-MM-DD" の文字列（dateKey）でやり取りする。
// Date のまま持ち回るとタイムゾーン次第で前日/翌日にズレるため、
// 「どの日か」を表すときは必ず文字列に落とす。

/** 表示中の年月。month は Date に合わせて 0-11。 */
export type YearMonth = { year: number; month: number };

export type CalendarCell = {
  date: Date;
  dateKey: string;
  /** 表示中の月の日か。前後の月からはみ出した日は false。 */
  isCurrentMonth: boolean;
};

/** 曜日の見出し（日曜始まり）。 */
export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// このアプリは日本時間で使う前提。サーバーの TZ 設定に関係なく
// 「日本にいる人にとっての今日」を出したいので、明示的に固定する。
const JST_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 日本時間での今日を YYYY-MM-DD で返す。 */
export function todayKeyInJst(): string {
  const parts = JST_PARTS.formatToParts(new Date());
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** YYYY-MM-DD をその日のローカル Date にする（曜日の計算などに使う）。 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** <time dateTime> や検索キーに使う YYYY-MM-DD 形式。 */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function toYearMonth(date: Date): YearMonth {
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function yearMonthOfDateKey(dateKey: string): YearMonth {
  return toYearMonth(parseDateKey(dateKey));
}

/**
 * 月を delta だけ動かす。
 * Date のコンストラクタは範囲外の月を勝手に繰り上げ/繰り下げてくれるので、
 * 12月+1 → 翌年1月 のような年またぎを自前で計算する必要はない。
 */
export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  return toYearMonth(new Date(year, month + delta, 1));
}

export function formatYearMonth({ year, month }: YearMonth): string {
  return `${year}年${month + 1}月`;
}

/** URL の ?month= に載せる YYYY-MM 形式。 */
export function toMonthParam({ year, month }: YearMonth): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** ?month= を読む。壊れていたら fallback を使う。 */
export function parseMonthParam(
  value: string | undefined,
  fallback: YearMonth,
): YearMonth {
  const matched = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!matched) return fallback;

  const year = Number(matched[1]);
  const month = Number(matched[2]) - 1;
  if (month < 0 || month > 11) return fallback;
  return { year, month };
}

/**
 * カレンダーに出るマス全体の範囲（前後の月からはみ出した日を含む）。
 *
 * 記録を引く範囲はここに合わせる。月初〜月末だけを引くと、月をまたぐ
 * 最初と最後の週で合計が欠けてしまうため（9月なら 8/31 の分が第1週に入らない）。
 */
export function gridRange(yearMonth: YearMonth): { from: string; to: string } {
  const weeks = buildMonthWeeks(yearMonth);
  const firstWeek = weeks[0]!;
  const lastWeek = weeks[weeks.length - 1]!;
  return {
    from: firstWeek[0]!.dateKey,
    to: lastWeek[lastWeek.length - 1]!.dateKey,
  };
}

export function isSameYearMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/**
 * 1ヶ月分を週（日曜始まり）の配列にして返す。
 * 週の頭と終わりが欠けないよう、前後の月の日で埋める。
 * 行数は月によって 4〜6 週で変わる。
 */
export function buildMonthWeeks(yearMonth: YearMonth): CalendarCell[][] {
  const { year, month } = yearMonth;
  // その月の1日が何曜日か。この分だけ前の月から借りて週の頭を埋める。
  const leadingDays = new Date(year, month, 1).getDay();
  // 月末日。翌月の 0 日目 = 当月の最終日。
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  const weeks: CalendarCell[][] = [];
  for (let offset = 0; offset < totalCells; offset++) {
    const date = new Date(year, month, offset - leadingDays + 1);
    if (offset % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push({
      date,
      dateKey: toDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    });
  }
  return weeks;
}
