"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { recordEvent } from "@/lib/actions/event";
import { amountClass, formatSignedYen, type Event } from "@/lib/event";

/**
 * イベントを1クリックで今日の記録にする。
 * 別の日に付けたいときはカレンダーのその日をクリックする（DayDialog）。
 */
export function QuickRecord({
  events,
  todayKey,
}: {
  events: Event[];
  /** 日本時間での今日（YYYY-MM-DD）。サーバーで決めて渡す。 */
  todayKey: string;
}) {
  const [message, setMessage] = useState<
    { kind: "done" | "error"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const record = (event: Event) => {
    setMessage(null);
    startTransition(async () => {
      const error = await recordEvent(event.id, todayKey);
      setMessage(
        error
          ? { kind: "error", text: error }
          : { kind: "done", text: `${event.title} を今日に記録しました` },
      );
    });
  };

  // 金額は 0 を弾いてあるので、正と負で漏れなく分かれる
  const plusEvents = events.filter((event) => event.amount > 0);
  const minusEvents = events.filter((event) => event.amount < 0);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        クリックで今日に記録
      </h2>

      {events.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          イベントがまだありません。
          <Link href="/events" className="underline underline-offset-2">
            イベントページ
          </Link>
          から追加してください。
        </p>
      ) : (
        <>
          <Group
            label="増える"
            dotClass="bg-emerald-500"
            events={plusEvents}
            isPending={isPending}
            onRecord={record}
          />
          <Group
            label="減る"
            dotClass="bg-red-500"
            events={minusEvents}
            isPending={isPending}
            onRecord={record}
          />
        </>
      )}

      {message && (
        <p
          role="status"
          className={`text-sm ${
            message.kind === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}

function Group({
  label,
  dotClass,
  events,
  isPending,
  onRecord,
}: {
  label: string;
  dotClass: string;
  events: Event[];
  isPending: boolean;
  onRecord: (event: Event) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        {label}
      </h3>

      {events.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">なし</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onRecord(event)}
                className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <span className="min-w-0 flex-1 truncate text-zinc-900 dark:text-zinc-100">
                  {event.title}
                </span>
                <span
                  className={`shrink-0 font-semibold tabular-nums ${amountClass(event.amount)}`}
                >
                  {formatSignedYen(event.amount)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
