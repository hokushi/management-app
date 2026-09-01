import bcrypt from "bcryptjs";
import { userRepository, type User } from "../infrastructure/repositories/user.js";

// bcrypt のコスト。上げるほど総当たりに強くなるが、その分ログインが遅くなる。
const SALT_ROUNDS = 10;

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export const userService = {
  async list(): Promise<User[]> {
    return userRepository.list();
  },

  /** ユーザーを作る。パスワードはハッシュ化してから渡す。 */
  async create({ name, email, password }: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    // メールは大文字小文字を区別しない扱いにしたいので小書きに正規化する
    return userRepository.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    });
  },
};
