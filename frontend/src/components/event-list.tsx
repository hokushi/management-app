"use client";

import { useState, useTransition } from "react";
import { deleteEvent, recordEvent } from "@/lib/actions/event";
import { formatSignedYen, type Event } from "@/lib/event";

export function EventList({ events }: { events: Event[] }) {
  // エラーは行ごとではなく一覧全体で1つ持つ。同時に複数は起きないため。
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<string | null>) => {
    setError(null);
    startTransition(async () => {
      setError(await action());
    });
  };

  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        やることがまだありません。上のフォームから追加してください。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex items-center gap-3 px-4 py-3 sm:gap-4"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
              {event.title}
            </span>

            <span
              className={`shrink-0 text-sm font-semibold tabular-nums ${amountClass(event.amount)}`}
            >
              {formatSignedYen(event.amount)}
            </span>

            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => recordEvent(event.id))}
              className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              やった
            </button>

            <button
              type="button"
              disabled={isPending}
              aria-label={`${event.title} を削除`}
              onClick={() => run(() => deleteEvent(event.id))}
              className="shrink-0 rounded-md px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function amountClass(amount: number): string {
  return amount < 0
    ? "text-red-600 dark:text-red-400"
    : "text-emerald-600 dark:text-emerald-400";
}
