"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteLog, recordEvent } from "@/lib/actions/event";
import { WEEKDAY_LABELS, parseDateKey } from "@/lib/calendar";
import {
  amountClass,
  formatSignedYen,
  type Event,
  type EventLog,
} from "@/lib/event";

export function DayDialog({
  dateKey,
  events,
  logs,
  onClose,
}: {
  dateKey: string;
  events: Event[];
  logs: EventLog[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // マウント時に開く。showModal は DOM のメソッドなので effect から呼ぶ。
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const run = (action: () => Promise<string | null>) => {
    setError(null);
    startTransition(async () => {
      setError(await action());
    });
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="day-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <h2 id="day-dialog-title" className="text-lg font-semibold">
            {formatDayTitle(dateKey)}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="閉じる"
            className="rounded-md px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            この日の記録
          </h3>
          {logs.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              まだありません。
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {log.title}
                  </span>
                  <span
                    className={`shrink-0 text-sm font-medium tabular-nums ${amountClass(log.amount)}`}
                  >
                    {formatSignedYen(log.amount)}
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => deleteLog(log.id))}
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-red-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                  >
                    取り消し
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            やったことを記録
          </h3>
          {events.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              イベントがまだありません。「イベント」ページから追加してください。
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {events.map((event) => (
                <li key={event.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {event.title}
                  </span>
                  <span
                    className={`shrink-0 text-sm font-medium tabular-nums ${amountClass(event.amount)}`}
                  >
                    {formatSignedYen(event.amount)}
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => recordEvent(event.id, dateKey))}
                    className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    やった
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </dialog>
  );
}

/** 「8月16日(日)」の形にする。 */
function formatDayTitle(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${date.getMonth() + 1}月${date.getDate()}日(${WEEKDAY_LABELS[date.getDay()]})`;
}
