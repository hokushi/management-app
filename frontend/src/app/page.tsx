import { Calendar } from "@/components/calendar";
import { BalanceCard } from "@/components/balance-card";
import { QuickRecord } from "@/components/quick-record";
import { getCurrentUser } from "@/lib/current-user";
import { serverGetAsUser } from "@/lib/server-api";
import {
  monthRange,
  parseMonthParam,
  todayKeyInJst,
  yearMonthOfDateKey,
} from "@/lib/calendar";
import { groupLogsByDate, type Event, type EventLog } from "@/lib/event";

export default async function Home(props: PageProps<"/">) {
  const todayKey = todayKeyInJst();
  const viewMonth = parseMonthParam(
    stringParam((await props.searchParams).month),
    yearMonthOfDateKey(todayKey),
  );

  const user = await getCurrentUser();

  if (!user) {
    return (
      <Shell>
        <Calendar
          viewMonth={viewMonth}
          todayKey={todayKey}
          events={[]}
          logsByDate={{}}
        />
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          先に右上からユーザーを作成してください。
        </p>
      </Shell>
    );
  }

  // カレンダーは表示中の月の記録だけを引く。残高は全期間の合計。
  const { from, to } = monthRange(viewMonth);
  const [balanceData, logsData, eventsData] = await Promise.all([
    serverGetAsUser<{ balance: number }>("/balance", user.id),
    serverGetAsUser<{ logs: EventLog[] }>(
      `/logs?from=${from}&to=${to}&limit=500`,
      user.id,
    ),
    serverGetAsUser<{ events: Event[] }>("/events", user.id),
  ]);

  const events = eventsData?.events ?? [];

  return (
    <Shell>
      <BalanceCard balance={balanceData?.balance ?? 0} userName={user.name} />

      {/* 広い画面ではカレンダーの横に並べ、狭い画面では下に回す */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <Calendar
            viewMonth={viewMonth}
            todayKey={todayKey}
            events={events}
            logsByDate={groupLogsByDate(logsData?.logs ?? [])}
          />
        </div>

        {/* スクロールしても押せるように、横並びのときは追従させる */}
        <div className="lg:sticky lg:top-6 lg:w-72 lg:shrink-0">
          <QuickRecord events={events} todayKey={todayKey} />
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-8 font-sans dark:bg-black sm:px-6 sm:py-12">
      <main className="flex w-full max-w-6xl flex-col gap-6">{children}</main>
    </div>
  );
}

/** 同じキーが複数回来ると配列になるので、最初の1つだけ見る。 */
function stringParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
