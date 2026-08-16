import type { FastifyInstance } from "fastify";
import { userController } from "../controllers/user.js";

// メールの形式チェック。ajv の format: "email" は追加プラグインが要るので、
// ここでは「@ の前後に空白でない文字があり、ドメインにドットがある」だけ見る。
// 厳密な検証は結局メール送信でしかできないので、ここは打ち間違いを弾く程度でよい。
const EMAIL_PATTERN = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

// bcrypt は 72 バイトを超える分を無視するため、上限を 72 にしておく
// （黙って切り捨てられるより、入力時に弾いた方が分かりやすい）。
const createUserBodySchema = {
  type: "object",
  required: ["name", "email", "password"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 50 },
    email: { type: "string", minLength: 3, maxLength: 255, pattern: EMAIL_PATTERN },
    password: { type: "string", minLength: 8, maxLength: 72 },
  },
} as const;

export async function userRoutes(app: FastifyInstance) {
  app.get("/users", userController.list);

  app.post(
    "/users",
    { schema: { body: createUserBodySchema } },
    userController.create,
  );
}
