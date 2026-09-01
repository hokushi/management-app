"use client";

import { useState, useTransition } from "react";
import { selectUser } from "@/lib/actions/user";
import type { User } from "@/lib/user";

export function UserSwitcher({
  users,
  currentUser,
}: {
  users: User[];
  currentUser: User;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const choose = (userId: number) => {
    setOpen(false);
    if (userId === currentUser.id) return;
    startTransition(async () => {
      await selectUser(userId);
    });
  };

  return (
    <div
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={isPending}
        className="flex h-9 items-center gap-2 rounded-md border border-zinc-300 pl-1.5 pr-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <Avatar name={currentUser.name} />
        <span className="max-w-32 truncate">{currentUser.name}</span>
        <span aria-hidden className="text-xs text-zinc-500">
          ▾
        </span>
      </button>

      {open && (
        <>
          {/* メニューの外側をクリックしたら閉じる */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              ユーザーを切り替え
            </p>
            {users.map((user) => {
              const isCurrent = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isCurrent}
                  onClick={() => choose(user.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Avatar name={user.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-zinc-900 dark:text-zinc-100">
                      {user.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {user.email}
                    </span>
                  </span>
                  {isCurrent && (
                    <span aria-hidden className="text-sm text-zinc-900 dark:text-zinc-100">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
    >
      {/* 絵文字などのサロゲートペアを壊さないよう配列にしてから1文字取る */}
      {[...name][0] ?? "?"}
    </span>
  );
}
