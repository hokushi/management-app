import Link from "next/link";
import { getCurrentUser, getUsers } from "@/lib/current-user";
import { CreateUserDialog } from "./create-user-dialog";
import { UserSwitcher } from "./user-switcher";

const navLinkClass =
  "rounded-md px-2.5 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

export async function Header() {
  const users = await getUsers();
  const currentUser = await getCurrentUser(users);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-3 font-sans dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
      <div className="flex min-w-0 items-center gap-1 sm:gap-3">
        <span className="hidden text-sm font-semibold text-zinc-900 dark:text-zinc-50 sm:inline">
          management-app
        </span>
        <nav className="flex items-center gap-1">
          <Link href="/" className={navLinkClass}>
            カレンダー
          </Link>
          <Link href="/events" className={navLinkClass}>
            イベント
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {currentUser ? (
          <UserSwitcher users={users} currentUser={currentUser} />
        ) : (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            ユーザーがいません
          </span>
        )}
        <CreateUserDialog />
      </div>
    </header>
  );
}
