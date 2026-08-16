import { sql } from "drizzle-orm";
import { db } from "../infrastructure/db/index.js";

export const healthService = {
  /** DB に到達できるか確認する。繋がらなければ例外が飛ぶ。 */
  async checkDatabase(): Promise<void> {
    await db.execute(sql`select 1`);
  },
};
