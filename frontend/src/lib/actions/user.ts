"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_BASE } from "@/lib/server-api";
import { CURRENT_USER_COOKIE, type User } from "@/lib/user";

// 型は実行時に消えるのでここに置いてよいが、値（定数など）は置けない。
// "use server" ファイルは async 関数しか export できず、実行時にエラーになる。
export type CreateUserState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string };

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * ユーザー作成の Server Action。
 * パスワードを含むので、ブラウザから backend を直接叩かずサーバー経由にする。
 * 入力チェックの正解は backend 側にあるので、ここでは値の取り出しだけを行い、
 * エラーメッセージは backend が返したものをそのまま見せる。
 */
export async function createUser(
  _prevState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      // backend はエラーを { error: string } に統一して返す
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return {
        status: "error",
        message: data?.error ?? "ユーザーの作成に失敗しました",
      };
    }

    // 作った直後はその人に切り替わっている方が自然なので選択状態にする
    const { user } = (await res.json()) as { user: User };
    await setCurrentUserCookie(user.id);
    revalidatePath("/", "layout");

    return { status: "success", name: user.name };
  } catch {
    return { status: "error", message: "サーバーに接続できませんでした" };
  }
}

/** 表示中のユーザーを切り替える。 */
export async function selectUser(userId: number): Promise<void> {
  await setCurrentUserCookie(userId);
  // ヘッダーは layout にあるので layout ごと作り直す
  revalidatePath("/", "layout");
}

async function setCurrentUserCookie(userId: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CURRENT_USER_COOKIE, String(userId), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_IN_SECONDS,
  });
}
