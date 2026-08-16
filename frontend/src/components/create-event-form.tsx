"use client";

import { useActionState } from "react";
import { createEvent, type CreateEventState } from "@/lib/actions/event";

const INITIAL_STATE: CreateEventState = { status: "idle" };

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:border-zinc-100";

export function CreateEventForm() {
  const [state, formAction, isPending] = useActionState(
    createEvent,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            やること
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={50}
            placeholder="ジムに行く"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="direction" className="text-sm font-medium">
            増減
          </label>
          <select id="direction" name="direction" className={inputClass}>
            <option value="plus">増える</option>
            <option value="minus">減る</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-sm font-medium">
            金額（円）
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            required
            min={1}
            max={10000000}
            step={1}
            placeholder="500"
            className={`${inputClass} sm:w-32`}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-9.5 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isPending ? "追加中…" : "追加"}
        </button>
      </div>

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
