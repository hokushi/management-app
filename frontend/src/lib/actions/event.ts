"use server";

import { revalidatePath } from "next/cache";
import { API_BASE } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/current-user";

export type CreateEventState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

/** 増減の向き。フォームでは金額を正の数で入力し、ここで符号を付ける。 */
type Direction = "plus" | "minus";

export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const title = String(formData.get("title") ?? "").trim();
  const rawAmount = Number(formData.get("amount"));
  const direction = String(formData.get("direction") ?? "plus") as Direction;

  if (!Number.isInteger(rawAmount) || rawAmount <= 0) {
    return { status: "error", message: "金額は1以上の整数で入力してください" };
  }

  const amount = direction === "minus" ? -rawAmount : rawAmount;
  const error = await send("/events", {
    method: "POST",
    body: { title, amount },
  });

  return error ? { status: "error", message: error } : { status: "success" };
}

export async function recordEvent(eventId: number): Promise<string | null> {
  return send(`/events/${eventId}/logs`, { method: "POST" });
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

    revalidatePath("/events");
    return null;
  } catch {
    return "サーバーに接続できませんでした";
  }
}
