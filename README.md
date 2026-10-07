# management-app

pnpm workspace の monorepo。

```
management-app/
├── frontend/            Next.js（App Router）+ Tailwind CSS
├── backend/             Fastify + Drizzle ORM + PostgreSQL
├── db/pgadmin/          pgAdmin の初期設定（サーバー自動登録）
└── docker-compose.yml   db / backend / pgadmin
```

## 前提

- Node.js 22 以上
- pnpm 11 以上
- Docker Desktop

## セットアップ

```bash
pnpm install
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env.local   # ホストで backend を直接動かす場合のみ
```

## 起動

```bash
pnpm dev     # docker compose up -d してから frontend の dev サーバーを起動
```

個別に動かす場合:

```bash
pnpm up          # db / backend / pgadmin を docker で起動
pnpm down        # 停止
pnpm logs        # backend のログを追う
pnpm dev:front   # frontend だけ（http://localhost:3100）
pnpm dev:back    # backend だけホストで起動（docker の backend は落としておく）
```

## ポート

| サービス | URL                     |
| -------- | ----------------------- |
| frontend | http://localhost:3100   |
| backend  | http://localhost:4000   |
| pgAdmin  | http://localhost:8081   |
| Postgres | `localhost:5434`        |

ポートは他プロジェクトとぶつからない値に固定してある。frontend は Next.js の
既定の 3000 ではなく 3100（3000 / 3001 は他プロジェクトが使っている想定）、
Postgres も 5432 / 5433 を避けて 5434 にしている。空いている番号に逃げられると
ブックマークや CORS の設定が毎回変わるので、固定しておく。

pgAdmin のログインは `admin@example.com` / `admin`、DB のパスワードは `postgres`。

## DB スキーマ

`backend/src/infrastructure/db/schema.ts` に「あるべき完成形」を宣言し、
`pnpm --filter backend db:push` で差分を DB に当てる。
docker で backend を起動した場合は起動時に自動で実行される。
