"use client";

import { useState, useTransition } from "react";
import { deleteLog } from "@/lib/actions/event";
import { parseDateKey } from "@/lib/calendar";
import { formatSignedYen, type EventLog } from "@/lib/event";
import { amountClass } from "./event-list";

export function LogList({ logs }: { logs: EventLog[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (logs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        記録がまだありません。
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
        {logs.map((log) => (
          <li key={log.id} className="flex items-center gap-3 px-4 py-2.5">
            <time
              dateTime={log.doneOn}
              className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
            >
              {formatDoneOn(log.doneOn)}
            </time>
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
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
              aria-label={`${log.title} の記録を取り消す`}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  setError(await deleteLog(log.id));
                });
              }}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
            >
              取り消し
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 「8/16」の形にする。doneOn は日付だけなのでタイムゾーンの影響を受けない。 */
function formatDoneOn(doneOn: string): string {
  const date = parseDateKey(doneOn);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
