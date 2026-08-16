import "server-only";

// サーバーコンポーネント / Server Action 専用。backend を叩く。

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** 失敗時は null を返す（backend が落ちていても画面自体は出せるようにする）。 */
export async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * 「誰のデータか」を X-User-Id で伝えて GET する。
 * ログインが無いうちの仮の仕組み（backend/src/middleware/currentUser.ts 参照）。
 */
export async function serverGetAsUser<T>(
  path: string,
  userId: number,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "X-User-Id": String(userId) },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
