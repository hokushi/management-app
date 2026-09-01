#!/bin/sh
# 開発コンテナの起動手順。スキーマを当ててから dev サーバーを起動する。
#
# drizzle-kit push は、スキーマを当てられなかったときでも終了コード 0 を返す。
# 例えば列の改名かどうかを尋ねるプロンプトは TTY の無いコンテナでは出せず、
# エラーを表示して何もせずに終わる。`push && tsx` と繋いでいるだけだと
# そのまま起動してしまい、古いスキーマのまま動いて実行時に初めて壊れる。
# 出力を見て、適用できたと分かったときだけサーバーを起動する。
set -e

output="$(node_modules/.bin/drizzle-kit push 2>&1)"
printf '%s\n' "$output"

case "$output" in
  *"Changes applied"* | *"No changes detected"*) ;;
  *)
    echo "" >&2
    echo "drizzle-kit push がスキーマを適用できませんでした。" >&2
    echo "列の改名など対話的な確認が要る変更は、ホストから" >&2
    echo "  pnpm --filter backend db:push" >&2
    echo "を実行して解消してから起動し直してください。" >&2
    exit 1
    ;;
esac

exec node_modules/.bin/tsx watch src/server.ts
