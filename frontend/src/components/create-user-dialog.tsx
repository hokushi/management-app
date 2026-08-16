"use client";

import { useActionState, useRef, useState } from "react";
import { createUser, type CreateUserState } from "@/lib/actions/user";

const INITIAL_STATE: CreateUserState = { status: "idle" };

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:border-zinc-100";

const primaryButtonClass =
  "flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900";

const secondaryButtonClass =
  "flex h-9 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

export function CreateUserDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // ダイアログを閉じるたびにフォームを作り直して、前回の結果を消す。
  // useActionState には reset が無いので key を変えて作り直すのが素直。
  const [formKey, setFormKey] = useState(0);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        className={primaryButtonClass}
        onClick={() => dialogRef.current?.showModal()}
      >
        ユーザー作成
      </button>

      {/* native の <dialog>。Esc で閉じる・フォーカストラップはブラウザ任せ。 */}
      <dialog
        ref={dialogRef}
        aria-labelledby="create-user-title"
        onClose={() => setFormKey((key) => key + 1)}
        // 背景（dialog 自身の余白）をクリックしたら閉じる
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <CreateUserForm key={formKey} onClose={close} />
      </dialog>
    </>
  );
}

function CreateUserForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(
    createUser,
    INITIAL_STATE,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-5">
        <h2 id="create-user-title" className="text-lg font-semibold">
          ユーザーを作成しました
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {state.name} さんを登録しました。
        </p>
        <div className="flex justify-end">
          <button type="button" className={primaryButtonClass} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <h2 id="create-user-title" className="text-lg font-semibold">
        ユーザー作成
      </h2>

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          名前
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={50}
          autoComplete="name"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={255}
          autoComplete="email"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">8文字以上</p>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className={secondaryButtonClass} onClick={onClose}>
          キャンセル
        </button>
        <button type="submit" className={primaryButtonClass} disabled={isPending}>
          {isPending ? "作成中…" : "作成"}
        </button>
      </div>
    </form>
  );
}
