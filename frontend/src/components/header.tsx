import { getCurrentUser, getUsers } from "@/lib/current-user";
import { CreateUserDialog } from "./create-user-dialog";
import { UserSwitcher } from "./user-switcher";

export async function Header() {
  const users = await getUsers();
  const currentUser = await getCurrentUser(users);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-3 font-sans dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        management-app
      </span>

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
