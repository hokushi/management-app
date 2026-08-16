# backend

Fastify + Drizzle ORM + PostgreSQL のバックエンド。

## ディレクトリ

```
src/
├── server.ts                  起動だけ（listen）
├── app.ts                     Fastify インスタンスの組み立て（プラグイン / ルート登録）
├── errors.ts                  アプリ共通のドメインエラー
├── config/
│   ├── env.ts                 環境変数をここに集約する
│   └── loadEnv.ts             .env.local の読み込みと requireEnv
├── routes/                    URL とバリデーションスキーマの定義
├── controllers/               リクエスト / レスポンスの変換
├── services/                  ビジネスロジック
└── infrastructure/
    └── db/
        ├── index.ts           drizzle クライアント
        └── schema.ts          テーブル定義（あるべき完成形を宣言する）
```

依存の向きは `routes → controllers → services → infrastructure`。
service より上は DB の詳細を知らない。

## 起動

docker で起動する場合はリポジトリのルートで `pnpm up`（`docker compose up -d`）。
`drizzle-kit push` がコンテナ起動時に走るので、スキーマは自動で反映される。

ホストで直接起動する場合:

```bash
cp .env.example .env.local   # 初回のみ
pnpm db:push                 # スキーマを DB に反映
pnpm dev
```

## スキーマ変更

`src/infrastructure/db/schema.ts` を書き換えて `pnpm db:push`。
マイグレーションファイルは持たず、宣言した状態との差分をツールが計算して当てる。

列の改名を伴う変更では、drizzle-kit が「改名か、削除＋追加か」を対話で聞いてくる。
コンテナには TTY が無いのでそこで失敗する（しかも終了コードは 0 で返る）ため、
そういう変更は先にホストで `pnpm --filter backend db:push` を実行して解消する。
コンテナ側は `docker-entrypoint.dev.sh` が適用の成否を見て、
当てられていなければ起動せずに落ちる。

## エンドポイント

| メソッド | パス         | 内容                  |
| -------- | ------------ | --------------------- |
| GET      | `/`          | サービス名            |
| GET      | `/health`    | プロセスの生存確認    |
| GET      | `/health/db` | DB まで含めた疎通確認 |
| GET      | `/users`     | ユーザー一覧          |
| POST     | `/users`     | ユーザー作成          |

`POST /users` は `{ name, email, password }` を受け取り、パスワードを bcrypt で
ハッシュ化して保存する。成功すると 201 で `{ user }` を返す（`passwordHash` は含めない）。
メールが既に使われている場合は 409。

### ユーザーに紐づくエンドポイント

以下は `X-User-Id` ヘッダーが必須（無ければ 400）。

| メソッド | パス                    | 内容                              |
| -------- | ----------------------- | --------------------------------- |
| GET      | `/events`               | やること一覧                      |
| POST     | `/events`               | やること作成                      |
| DELETE   | `/events/:eventId`      | やること削除                      |
| POST     | `/events/:eventId/logs` | 「やった」記録を1件足す           |
| DELETE   | `/logs/:logId`          | 記録の取り消し                    |
| GET      | `/logs`                 | 記録一覧（`from` / `to` で絞れる） |
| GET      | `/balance`              | 使える金額（全期間の合計）        |

記録の日付（`doneOn`）は必須で、既定値をサーバー側では決めない。
「どのタイムゾーンの今日か」はサーバーには分からないので、呼び出し側が決める。

`X-User-Id` はログインが実装されるまでの仮の仕組みで、認証ではない
（呼び出し側が他人の ID を名乗れる）。`src/middleware/currentUser.ts` を
トークン検証に差し替えるのが移行先。

### エラー

種類によらず `{ error: string }` の形で返す。ドメインエラーと
ステータスコードの対応は `src/app.ts` の `ERROR_STATUS` にまとめてある。

