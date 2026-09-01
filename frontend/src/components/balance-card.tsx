import { formatYen } from "@/lib/event";

export function BalanceCard({
  balance,
  userName,
}: {
  balance: number;
  userName: string;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white px-5 py-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        使える金額
      </h1>
      <p
        className={`mt-1 text-4xl font-semibold tabular-nums ${
          balance < 0
            ? "text-red-600 dark:text-red-400"
            : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {formatYen(balance)}
      </p>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {userName} さんの記録の合計
      </p>
    </section>
  );
}
