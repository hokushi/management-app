import { CreateUserDialog } from "./create-user-dialog";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-3 font-sans dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        management-app
      </span>
      <CreateUserDialog />
    </header>
  );
}
