// アプリ共通のドメインエラー。
// インフラ層（DB のエラーコード等）をここで定義したドメインエラーに変換し、
// 上位層（service / controller）は DB の詳細を知らずに済むようにする。
// 機能を足すたびにここへエラーを追加していく。

// メールアドレスの重複。users.email の UNIQUE 制約違反をこれに変換する。
export class EmailAlreadyExistsError extends Error {
  constructor(message = "このメールアドレスは既に登録されています") {
    super(message);
    this.name = "EmailAlreadyExistsError";
  }
}

// リソースが存在しない、またはアクセス権がない。
// 「他人のリソースの有無」を漏らさないため、未所有も未存在と同じ扱いにする。
export class NotFoundError extends Error {
  constructor(message = "リソースが見つかりません") {
    super(message);
    this.name = "NotFoundError";
  }
}

// 未認証（トークンが無い・無効・アカウント不在）。
export class UnauthenticatedError extends Error {
  constructor(message = "認証が必要です") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}
