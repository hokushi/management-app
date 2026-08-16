import "server-only";

// サーバーコンポーネント専用。backend から GET する。
// 失敗時は null を返す（backend が落ちていても画面自体は出せるようにする）。

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
