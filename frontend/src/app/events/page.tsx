import { getCurrentUser } from "@/lib/current-user";
import { serverGetAsUser } from "@/lib/server-api";
import { formatYen, type Event, type Summary } from "@/lib/event";
import { CreateEventForm } from "@/components/create-event-form";
import { EventList } from "@/components/event-list";
import { LogList, type LogRow } from "@/components/log-list";

export const metadata = {
  title: "イベント | management-app",
};

export default async function EventsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Shell>
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          先に右上からユーザーを作成してください。
        </p>
      </Shell>
    );
  }

  const [eventsData, summary] = await Promise.all([
    serverGetAsUser<{ events: Event[] }>("/events", user.id),
    serverGetAsUser<Summary>("/summary", user.id),
  ]);

  const events = eventsData?.events ?? [];
  const balance = summary?.balance ?? 0;
  const logs: LogRow[] = (summary?.logs ?? []).map((log) => ({
    id: log.id,
    title: log.title,
    amount: log.amount,
    doneAtLabel: formatDoneAt(log.doneAt),
  }));

  return (
    <Shell>
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
          {user.name} さんの記録の合計
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          やること
        </h2>
        <CreateEventForm />
        <EventList events={events} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          履歴
        </h2>
        <LogList logs={logs} />
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-8 font-sans dark:bg-black sm:px-6 sm:py-12">
      <main className="flex w-full max-w-3xl flex-col gap-8">{children}</main>
    </div>
  );
}

/**
 * 「8/16 14:20」の形にする。
 * サーバー側で文字列にしてからクライアントに渡すので、
 * ブラウザのタイムゾーンとの食い違いは起きない。
 */
function formatDoneAt(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
