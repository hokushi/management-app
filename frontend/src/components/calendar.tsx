"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  WEEKDAY_LABELS,
  addMonths,
  buildMonthWeeks,
  formatYearMonth,
  isSameYearMonth,
  toMonthParam,
  yearMonthOfDateKey,
  type YearMonth,
} from "@/lib/calendar";
import {
  amountClass,
  formatSignedYen,
  formatYen,
  sumAmounts,
  type Event,
  type EventLog,
} from "@/lib/event";
import { DayDialog } from "./day-dialog";

// 1マスに出す記録の数。これを超えた分は「他 n件」にまとめる。
const MAX_LOGS_PER_CELL = 2;

// 曜日7列＋右端の週計1列。ヘッダーと本体で同じ定義を使い、列をずらさない。
const gridClass =
  "grid grid-cols-[repeat(7,minmax(0,1fr))_5.5rem] sm:grid-cols-[repeat(7,minmax(0,1fr))_7rem]";

const navLinkClass =
  "flex h-9 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900";

export function Calendar({
  viewMonth,
  todayKey,
  events,
  logsByDate,
}: {
  viewMonth: YearMonth;
  /** 日本時間での今日（YYYY-MM-DD）。サーバーで決めて渡す。 */
  todayKey: string;
  events: Event[];
  logsByDate: Record<string, EventLog[]>;
}) {
  // 開いている日。null なら閉じている。
  const [openDateKey, setOpenDateKey] = useState<string | null>(null);

  const weeks = buildMonthWeeks(viewMonth);
  const isViewingCurrentMonth = isSameYearMonth(
    viewMonth,
    yearMonthOfDateKey(todayKey),
  );

  return (
    <section className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 sm:text-xl">
          {formatYearMonth(viewMonth)}
        </h2>

        {/* 月移動は URL に持たせる。表示中の月の記録だけをサーバーで引くため。 */}
        <div className="flex items-center gap-2">
          <Link
            href={`/?month=${toMonthParam(addMonths(viewMonth, -1))}`}
            className={navLinkClass}
            aria-label="前の月"
          >
            ←
          </Link>
          <Link
            href="/"
            aria-label="今月に戻る"
            aria-disabled={isViewingCurrentMonth}
            className={`${navLinkClass} ${isViewingCurrentMonth ? "pointer-events-none opacity-40" : ""}`}
          >
            今日
          </Link>
          <Link
            href={`/?month=${toMonthParam(addMonths(viewMonth, 1))}`}
            className={navLinkClass}
            aria-label="次の月"
          >
            →
          </Link>
        </div>
      </header>

      <div
        className={`${gridClass} border-b border-zinc-200 dark:border-zinc-800`}
      >
        {WEEKDAY_LABELS.map((label, weekday) => (
          <div
            key={label}
            className={`py-2 text-center text-xs font-medium ${weekdayTextClass(weekday, true)}`}
          >
            {label}
          </div>
        ))}
        <div className="border-l border-zinc-200 py-2 text-center text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          週計
        </div>
      </div>

      {/* 罫線は各セルの上/左ボーダーで引き、外周は親の border に任せる */}
      <div className={gridClass}>
        {weeks.map((week, weekIndex) => (
          <Fragment key={week[0]!.dateKey}>
            {week.map(({ dateKey, date, isCurrentMonth }, weekday) => {
              const logs = logsByDate[dateKey] ?? [];
              const isToday = dateKey === todayKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setOpenDateKey(dateKey)}
                  aria-label={`${date.getMonth() + 1}月${date.getDate()}日の記録`}
                  className={`flex min-h-20 flex-col items-stretch gap-1 border-zinc-200 p-1.5 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900 sm:min-h-24 sm:p-2 ${
                    weekIndex > 0 ? "border-t" : ""
                  } ${weekday > 0 ? "border-l" : ""} ${
                    isCurrentMonth ? "" : "bg-zinc-50/70 dark:bg-zinc-900/40"
                  }`}
                >
                  <time
                    dateTime={dateKey}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm tabular-nums ${
                      isToday
                        ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : weekdayTextClass(weekday, isCurrentMonth)
                    }`}
                  >
                    {date.getDate()}
                  </time>

                  <span className="flex min-w-0 flex-col gap-0.5">
                    {logs.slice(0, MAX_LOGS_PER_CELL).map((log) => (
                      <span
                        key={log.id}
                        className={`truncate rounded px-1 text-[11px] leading-4 ${
                          log.amount < 0
                            ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        }`}
                      >
                        {formatSignedYen(log.amount)} {log.title}
                      </span>
                    ))}
                    {logs.length > MAX_LOGS_PER_CELL && (
                      <span className="px-1 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
                        他 {logs.length - MAX_LOGS_PER_CELL}件
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

            <WeekTotal
              logs={week.flatMap((cell) => logsByDate[cell.dateKey] ?? [])}
              isFirstWeek={weekIndex === 0}
            />
          </Fragment>
        ))}
      </div>

      {openDateKey && (
        <DayDialog
          dateKey={openDateKey}
          events={events}
          logs={logsByDate[openDateKey] ?? []}
          onClose={() => setOpenDateKey(null)}
        />
      )}
    </section>
  );
}

/**
 * その週のプラスマイナス。前後の月からはみ出した日の分も含める
 * （週として見たときの増減なので、月の境目で切らない）。
 *
 * 増えた分・減った分を上に並べ、罫線を挟んで差し引きを下に置く。
 * 数字を3つ並べるだけだと関係が読めないので、足し算の形を見た目でなぞる。
 * 片側しか記録が無い週は内訳が差し引きと同じ額になるので、差し引きだけ出す。
 */
function WeekTotal({
  logs,
  isFirstWeek,
}: {
  logs: EventLog[];
  isFirstWeek: boolean;
}) {
  const total = sumAmounts(logs);
  const plus = sumAmounts(logs.filter((log) => log.amount > 0));
  const minus = sumAmounts(logs.filter((log) => log.amount < 0));
  const hasBreakdown = plus > 0 && minus < 0;

  return (
    <div
      className={`flex min-h-20 flex-col items-stretch gap-1 border-l border-zinc-200 bg-zinc-50/70 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/40 sm:min-h-24 sm:p-2 ${
        isFirstWeek ? "" : "border-t"
      }`}
    >
      {hasBreakdown && (
        <span className="flex flex-col gap-0.5">
          <WeekTotalRow label="増" amount={plus} />
          <WeekTotalRow label="減" amount={minus} />
        </span>
      )}

      {/*
        差し引きは mt-auto でセルの下端に寄せる。内訳がある週も無い週も
        同じ高さに並ぶので、週をまたいで縦に拾い読みできる。
      */}
      <span
        className={`mt-auto ${
          hasBreakdown
            ? "border-t border-zinc-300 pt-1 dark:border-zinc-700"
            : ""
        }`}
      >
        <WeekTotalRow label="差引" amount={total} isTotal />
      </span>
    </div>
  );
}

/** 週計の1行。数字だけだと何の額か読めないので、左に見出しを置く。 */
function WeekTotalRow({
  label,
  amount,
  isTotal = false,
}: {
  label: string;
  amount: number;
  isTotal?: boolean;
}) {
  const amountClasses = isTotal
    ? `text-[11px] font-semibold sm:text-xs ${
        amount === 0 ? "text-zinc-400 dark:text-zinc-600" : amountClass(amount)
      }`
    : `text-[10px] sm:text-[11px] ${amountClass(amount)}`;

  return (
    <span className="flex items-baseline justify-between gap-1">
      <span className="shrink-0 text-[10px] leading-4 text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className={`leading-4 tabular-nums ${amountClasses}`}>
        {amount === 0 ? formatYen(0) : formatSignedYen(amount)}
      </span>
    </span>
  );
}

/** 日曜は赤、土曜は青。前後の月の日は薄くする。 */
function weekdayTextClass(weekday: number, isCurrentMonth: boolean): string {
  if (!isCurrentMonth) return "text-zinc-400 dark:text-zinc-600";
  if (weekday === 0) return "text-red-600 dark:text-red-400";
  if (weekday === 6) return "text-blue-600 dark:text-blue-400";
  return "text-zinc-800 dark:text-zinc-200";
}
