"use server";

import { revalidatePath } from "next/cache";
import { API_BASE } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/current-user";

/** 増減の向き。フォームでは金額を正の数で入力し、ここで符号を付ける。 */
type Direction = "plus" | "minus";

/** 失敗ならエラーメッセージ、成功なら null。他のアクションと戻り値を揃えている。 */
export async function createEvent(formData: FormData): Promise<string | null> {
  const title = String(formData.get("title") ?? "").trim();
  const rawAmount = Number(formData.get("amount"));
  const direction = String(formData.get("direction") ?? "plus") as Direction;

  if (!Number.isInteger(rawAmount) || rawAmount <= 0) {
    return "金額は1以上の整数で入力してください";
  }

  return send("/events", {
    method: "POST",
    body: { title, amount: direction === "minus" ? -rawAmount : rawAmount },
  });
}

/** doneOn は "YYYY-MM-DD"。どの日にやったことにするかは呼び出し側が決める。 */
export async function recordEvent(
  eventId: number,
  doneOn: string,
): Promise<string | null> {
  return send(`/events/${eventId}/logs`, {
    method: "POST",
    body: { doneOn },
  });
}

export async function deleteEvent(eventId: number): Promise<string | null> {
  return send(`/events/${eventId}`, { method: "DELETE" });
}

export async function deleteLog(logId: number): Promise<string | null> {
  return send(`/logs/${logId}`, { method: "DELETE" });
}

/**
 * backend を叩いて、失敗ならエラーメッセージ、成功なら null を返す。
 * 成功時は画面を作り直して、残高と一覧を最新にする。
 */
async function send(
  path: string,
  options: { method: string; body?: unknown },
): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return "先にユーザーを作成してください";

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: options.method,
      headers: {
        "X-User-Id": String(user.id),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return data?.error ?? "処理に失敗しました";
    }

    // 残高と記録はカレンダー(/)と一覧(/events)の両方に出るのでまとめて作り直す
    revalidatePath("/", "layout");
    return null;
  } catch {
    return "サーバーに接続できませんでした";
  }
}
