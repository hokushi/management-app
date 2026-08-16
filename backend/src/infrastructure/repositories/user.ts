import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { EmailAlreadyExistsError } from "../../errors.js";

// PostgreSQL の一意制約違反。
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const UNIQUE_VIOLATION = "23505";

export type NewUser = {
  name: string;
  email: string;
  passwordHash: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

export const userRepository = {
  /** 全ユーザーを作成順で返す。ログインが無いうちは件数が知れているので絞り込みはしない。 */
  async list(): Promise<User[]> {
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.id);
  },

  /**
   * ユーザーを1件作る。
   * メールが既に使われている場合は EmailAlreadyExistsError を投げる
   * （事前に SELECT で確認する方式だと、その間に別のリクエストが
   * 同じメールで INSERT できてしまうため、制約違反を拾う形にする）。
   */
  async create(input: NewUser): Promise<User> {
    try {
      const rows = await db
        .insert(users)
        .values(input)
        // passwordHash は呼び出し側に返さない
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        });
      return rows[0]!;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new EmailAlreadyExistsError();
      }
      throw err;
    }
  },
};

/**
 * 一意制約違反かどうか。
 * Drizzle は driver のエラーを DrizzleQueryError で包み、元のエラーを cause に
 * 入れて投げるため、cause を辿って PostgreSQL のエラーコードを探す。
 */
function isUniqueViolation(err: unknown): boolean {
  for (let current = err; current instanceof Error; current = current.cause) {
    if (
      "code" in current &&
      (current as { code: unknown }).code === UNIQUE_VIOLATION
    ) {
      return true;
    }
  }
  return false;
}
