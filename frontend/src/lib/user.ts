// ユーザー関連で server / client の両方から参照する型と定数。
// Server Action のファイル（"use server"）には async 関数しか置けないので、
// 定数はこちらに分けている。

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

/**
 * 選択中のユーザー ID を入れる Cookie。
 * ログインが無いので認証情報ではなく「今どの人として見ているか」の目印。
 * サーバー側でしか読まないので httpOnly にしている。
 */
export const CURRENT_USER_COOKIE = "current_user_id";
