import "server-only";

import { cookies } from "next/headers";
import { serverGet } from "./server-api";
import { CURRENT_USER_COOKIE, type User } from "./user";

export async function getUsers(): Promise<User[]> {
  const data = await serverGet<{ users: User[] }>("/users");
  return data?.users ?? [];
}

/**
 * 今どのユーザーとして見ているかを返す。
 * Cookie が無い、または消されたユーザーを指している場合は先頭の人にする。
 * ユーザーが1人もいなければ null。
 */
export async function getCurrentUser(users?: User[]): Promise<User | null> {
  const list = users ?? (await getUsers());
  const selectedId = Number(
    (await cookies()).get(CURRENT_USER_COOKIE)?.value ?? "",
  );
  return list.find((user) => user.id === selectedId) ?? list[0] ?? null;
}
