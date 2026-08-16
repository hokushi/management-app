import { Calendar } from "@/components/calendar";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-8 font-sans dark:bg-black sm:px-6 sm:py-12">
      <main className="w-full max-w-4xl">
        <Calendar />
      </main>
    </div>
  );
}
