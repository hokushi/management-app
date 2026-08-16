# management-app

管理アプリ。Next.js (App Router) + TypeScript + Tailwind CSS で構築しています。

## 技術スタック

| 項目 | 内容 |
| --- | --- |
| フレームワーク | Next.js 16 (App Router / Turbopack) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| Lint | ESLint (eslint-config-next) |

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 を開くと確認できます。

## スクリプト

```bash
npm run dev     # 開発サーバー起動
npm run build   # 本番ビルド
npm run start   # 本番サーバー起動
npm run lint    # ESLint 実行
```

## ディレクトリ構成

```
src/
  app/          # App Router のページ・レイアウト
public/         # 静的ファイル
```
