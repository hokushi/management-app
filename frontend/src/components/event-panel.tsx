"use client";

import { useRef, useState, useTransition } from "react";
import { createEvent, deleteEvent, recordEvent } from "@/lib/actions/event";
import {
  amountClass,
  formatSignedYen,
  type Event,
  type EventKind,
} from "@/lib/event";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:border-zinc-100";

/**
 * イベントの一覧・追加・削除と、1クリックでの記録をまとめたパネル。
 * 記録は今日付けになる。別の日に付けたいときはカレンダーのその日をクリックする。
 */
export function EventPanel({
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

  const remove = (event: Event) => {
    // 押し間違いで消えると困るので確認する。
    // 過去の記録は残る（event_logs は金額を写して持っている）ので、その旨も伝える。
    const ok = window.confirm(
      `「${event.title}」を削除しますか？\nこれまでの記録と使える金額はそのまま残ります。`,
    );
    if (!ok) return;

    setMessage(null);
    startTransition(async () => {
      const error = await deleteEvent(event.id);
      if (error) setMessage({ kind: "error", text: error });
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
          イベントがまだありません。下のボタンから追加してください。
        </p>
      ) : (
        <>
          <Group
            label="増える"
            dotClass="bg-emerald-500"
            events={plusEvents}
            allEvents={events}
            isPending={isPending}
            onRecord={record}
            onRemove={remove}
          />
          <Group
            label="減る"
            dotClass="bg-red-500"
            events={minusEvents}
            allEvents={events}
            isPending={isPending}
            onRecord={record}
            onRemove={remove}
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

      <AddEventDialog streakEvents={events.filter((e) => e.kind === "streak")} />
    </section>
  );
}

function Group({
  label,
  dotClass,
  events,
  allEvents,
  isPending,
  onRecord,
  onRemove,
}: {
  label: string;
  dotClass: string;
  events: Event[];
  /** リセット相手のタイトルを引くために全件を渡す */
  allEvents: Event[];
  isPending: boolean;
  onRecord: (event: Event) => void;
  onRemove: (event: Event) => void;
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
            // 記録と削除は別のボタンにする（button の入れ子は書けない）
            <li key={event.id} className="flex items-stretch gap-1">
              <button
                type="button"
                // 積み上がるイベントは1日1回まで
                disabled={isPending || event.nextAmount === null}
                onClick={() => onRecord(event)}
                title={
                  event.nextAmount === null
                    ? "このイベントは今日すでに記録しています"
                    : undefined
                }
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-zinc-900 dark:text-zinc-100">
                    {event.title}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {eventNote(event, allEvents)}
                  </span>
                </span>
                <span
                  className={`shrink-0 font-semibold tabular-nums ${amountClass(event.amount)}`}
                >
                  {event.nextAmount === null
                    ? "—"
                    : formatSignedYen(event.nextAmount)}
                </span>
              </button>

              <button
                type="button"
                disabled={isPending}
                aria-label={`${event.title} を削除`}
                onClick={() => onRemove(event)}
                className="shrink-0 rounded-lg px-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** ボタンの2行目。積み上げ幅やリセット相手など、金額だけでは分からないことを出す。 */
function eventNote(event: Event, events: Event[]): string {
  const notes: string[] = [];
  if (event.kind === "streak") {
    notes.push(`${formatSignedYen(event.amount)}ずつ積み上げ`);
  }
  if (event.resetsEventId !== null) {
    const target = events.find((other) => other.id === event.resetsEventId);
    notes.push(`「${target?.title ?? "削除済み"}」をリセット`);
  }
  return notes.join(" / ");
}

function AddEventDialog({ streakEvents }: { streakEvents: Event[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // 閉じるたびにフォームを作り直して、前回の入力とエラーを消す
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex h-9 items-center justify-center rounded-md border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        ＋ イベントを追加
      </button>

      {/* native の <dialog>。Esc で閉じる・フォーカストラップはブラウザ任せ。 */}
      <dialog
        ref={dialogRef}
        aria-labelledby="add-event-title"
        onClose={() => setFormKey((key) => key + 1)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-left text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <AddEventForm
          key={formKey}
          streakEvents={streakEvents}
          onClose={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}

function AddEventForm({
  streakEvents,
  onClose,
}: {
  streakEvents: Event[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // 種類によってラベルと説明が変わるので、選択内容を持っておく
  const [kind, setKind] = useState<EventKind>("fixed");

  // action に関数を渡すと React が FormData を入れて呼んでくれる。
  // useActionState は使わない。成功時にその場で閉じたいので、
  // 結果を state に置くのではなくここで直接受け取る。
  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const failure = await createEvent(formData);
      if (failure) setError(failure);
      else onClose();
    });
  };

  return (
    <form action={submit} className="flex flex-col gap-5">
      <h2 id="add-event-title" className="text-lg font-semibold">
        イベントを追加
      </h2>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="event-title" className="text-sm font-medium">
          やること
        </label>
        <input
          id="event-title"
          name="title"
          type="text"
          required
          maxLength={50}
          placeholder="ジムに行く"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="event-kind" className="text-sm font-medium">
          種類
        </label>
        <select
          id="event-kind"
          name="kind"
          value={kind}
          onChange={(changeEvent) =>
            setKind(changeEvent.target.value as EventKind)
          }
          className={inputClass}
        >
          <option value="fixed">毎回同じ額</option>
          <option value="streak">やるたびに増える</option>
        </select>
        {kind === "streak" && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            1回目・2回目・3回目…と、下の額ずつ積み上がります。
            「積み上げをリセット」を付けたイベントを記録すると振り出しに戻ります。
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="event-direction" className="text-sm font-medium">
            増減
          </label>
          <select
            id="event-direction"
            name="direction"
            className={`${inputClass} w-auto`}
          >
            <option value="plus">増える</option>
            <option value="minus">減る</option>
          </select>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="event-amount" className="text-sm font-medium">
            {kind === "streak" ? "増え幅（円）" : "金額（円）"}
          </label>
          <input
            id="event-amount"
            name="amount"
            type="number"
            required
            min={1}
            max={10000000}
            step={1}
            placeholder="500"
            className={inputClass}
          />
        </div>
      </div>

      {/* リセットの相手が居ないうちは出しても選べないので隠す */}
      {streakEvents.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="event-resets" className="text-sm font-medium">
            積み上げをリセットする
          </label>
          <select id="event-resets" name="resetsEventId" className={inputClass}>
            <option value="">リセットしない</option>
            {streakEvents.map((streakEvent) => (
              <option key={streakEvent.id} value={streakEvent.id}>
                「{streakEvent.title}」をリセット
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            これを記録すると、選んだ積み上げが翌日から最初の額に戻ります。
            当日の記録はそのまま残ります。
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isPending ? "追加中…" : "追加"}
        </button>
      </div>
    </form>
  );
}
