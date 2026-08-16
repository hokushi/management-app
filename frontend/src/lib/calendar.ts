// カレンダーの日付計算。React に依存しない純粋な関数だけを置く。

/** 表示中の年月。month は Date に合わせて 0-11。 */
export type YearMonth = { year: number; month: number };

export type CalendarCell = {
  date: Date;
  /** 表示中の月の日か。前後の月からはみ出した日は false。 */
  isCurrentMonth: boolean;
};

/** 曜日の見出し（日曜始まり）。 */
export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function toYearMonth(date: Date): YearMonth {
  return { year: date.getFullYear(), month: date.getMonth() };
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

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** <time dateTime> に渡す YYYY-MM-DD 形式。 */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
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
      isCurrentMonth: date.getMonth() === month,
    });
  }
  return weeks;
}
