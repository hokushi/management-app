"use server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// 型は実行時に消えるのでここに置いてよいが、値（定数など）は置けない。
// "use server" ファイルは async 関数しか export できず、実行時にエラーになる。
export type CreateUserState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string };

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

    return { status: "success", name };
  } catch {
    return { status: "error", message: "サーバーに接続できませんでした" };
  }
}
