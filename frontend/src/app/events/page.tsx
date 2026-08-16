import { getCurrentUser } from "@/lib/current-user";
import { serverGetAsUser } from "@/lib/server-api";
import { todayKeyInJst } from "@/lib/calendar";
import type { Event, EventLog } from "@/lib/event";
import { BalanceCard } from "@/components/balance-card";
import { CreateEventForm } from "@/components/create-event-form";
import { EventList } from "@/components/event-list";
import { LogList } from "@/components/log-list";

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

  const [balanceData, logsData, eventsData] = await Promise.all([
    serverGetAsUser<{ balance: number }>("/balance", user.id),
    serverGetAsUser<{ logs: EventLog[] }>("/logs?limit=50", user.id),
    serverGetAsUser<{ events: Event[] }>("/events", user.id),
  ]);

  return (
    <Shell>
      <BalanceCard balance={balanceData?.balance ?? 0} userName={user.name} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          やること
        </h2>
        <CreateEventForm />
        {/* この画面から記録するときは「今日やった」扱いにする */}
        <EventList events={eventsData?.events ?? []} todayKey={todayKeyInJst()} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          履歴
        </h2>
        <LogList logs={logsData?.logs ?? []} />
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
