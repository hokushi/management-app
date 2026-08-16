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

## エンドポイント

| メソッド | パス         | 内容                       |
| -------- | ------------ | -------------------------- |
| GET      | `/`          | サービス名                 |
| GET      | `/health`    | プロセスの生存確認         |
| GET      | `/health/db` | DB まで含めた疎通確認      |
