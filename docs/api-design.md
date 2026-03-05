# 簡易API設計書

## 概要

- **フレームワーク**: FastAPI 0.115
- **ベースURL**: `http://localhost:8000`
- **APIバージョン**: v1（プレフィックス: `/api/v1`）
- **データ形式**: JSON
- **APIドキュメント（自動生成）**: http://localhost:8000/docs

---

## エンドポイント一覧

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/health` | ヘルスチェック |
| GET | `/api/v1/articles` | 記事一覧取得 |
| POST | `/api/v1/articles` | 記事作成 |
| GET | `/api/v1/articles/categories` | カテゴリ一覧取得 |
| GET | `/api/v1/articles/authors` | 著者一覧取得 |
| GET | `/api/v1/articles/search` | セマンティック検索 |
| GET | `/api/v1/articles/embeddings/status` | 埋め込み生成進捗取得 |
| GET | `/api/v1/articles/{id}` | 記事詳細取得 |
| PUT | `/api/v1/articles/{id}` | 記事更新 |
| DELETE | `/api/v1/articles/{id}` | 記事削除（論理削除） |

---

## エンドポイント詳細

### GET `/health`

サーバーの死活確認。

**レスポンス**
```json
{ "status": "ok" }
```

---

### GET `/api/v1/articles`

記事一覧を取得する。ページネーション・フィルタ・ソートに対応。

**クエリパラメータ**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `page` | integer | - | 1 | ページ番号 |
| `size` | integer | - | 20 | 1ページあたりの件数 |
| `q` | string | - | - | キーワード検索文字列 |
| `title_only` | boolean | - | false | trueの場合タイトルのみ検索 |
| `category` | string | - | - | カテゴリフィルタ |
| `author` | string | - | - | 著者フィルタ |
| `sort_by` | string | - | `created_at` | ソート対象（`created_at` / `published_at` / `title`） |
| `order` | string | - | `desc` | ソート順（`asc` / `desc`） |

**レスポンス**
```json
{
  "items": [
    {
      "id": 1,
      "title": "記事タイトル",
      "content": "本文テキスト...",
      "author": "著者名",
      "category": "カテゴリ",
      "published_at": "2024-01-01T00:00:00",
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 20,
  "pages": 5
}
```

---

### POST `/api/v1/articles`

新規記事を作成する。

**リクエストボディ**
```json
{
  "title": "記事タイトル",
  "content": "本文テキスト",
  "author": "著者名",
  "category": "カテゴリ",
  "published_at": "2024-01-01T00:00:00"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | string | 必須 | 記事タイトル（最大500文字） |
| `content` | string | 必須 | 記事本文 |
| `author` | string | - | 著者名 |
| `category` | string | - | カテゴリ |
| `published_at` | datetime | - | 公開日時 |

**レスポンス**: `201 Created` — 作成された記事オブジェクト

---

### GET `/api/v1/articles/categories`

登録済みのカテゴリ一覧を取得する。

**レスポンス**
```json
["AI", "Web開発", "データベース"]
```

---

### GET `/api/v1/articles/authors`

登録済みの著者一覧を取得する。フロントエンドの著者フィルターUIで使用する。

**レスポンス**
```json
["山田太郎", "鈴木花子", "田中一郎"]
```

---

### GET `/api/v1/articles/search`

ベクトル埋め込みを用いたセマンティック（意味的類似）検索を行う。

**クエリパラメータ**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `q` | string | 必須 | - | 検索クエリ文字列 |
| `page` | integer | - | 1 | ページ番号 |
| `limit` | integer | - | 20 | 1ページあたりの件数 |
| `threshold` | float | - | 0.3 | 類似度の最低閾値（0.0〜1.0） |
| `category` | string | - | - | カテゴリフィルタ |

**レスポンス**
```json
{
  "items": [
    {
      "id": 1,
      "title": "記事タイトル",
      "content": "本文テキスト...",
      "author": "著者名",
      "category": "カテゴリ",
      "published_at": "2024-01-01T00:00:00",
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00",
      "similarity": 0.87
    }
  ],
  "total": 5,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

---

### GET `/api/v1/articles/embeddings/status`

埋め込みベクトルの生成進捗を取得する。

**レスポンス**
```json
{
  "total": 500,
  "completed": 320,
  "percentage": 64.0
}
```

---

### GET `/api/v1/articles/{id}`

指定IDの記事を1件取得する。

**パスパラメータ**

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `id` | integer | 記事ID |

**レスポンス**: 記事オブジェクト / `404 Not Found`

---

### PUT `/api/v1/articles/{id}`

指定IDの記事を更新する。

**パスパラメータ**: `id` — 記事ID

**リクエストボディ**: POST と同じ形式（すべてのフィールドが任意）

**レスポンス**: 更新後の記事オブジェクト / `404 Not Found`

---

### DELETE `/api/v1/articles/{id}`

指定IDの記事を論理削除する（`deleted_at` に現在日時をセット）。

**パスパラメータ**: `id` — 記事ID

**レスポンス**: `200 OK`
```json
{ "message": "記事を削除しました" }
```
/ `404 Not Found`

---

## エラーレスポンス

| ステータスコード | 説明 |
|---------------|------|
| `400 Bad Request` | リクエストパラメータが不正 |
| `404 Not Found` | 指定リソースが存在しない |
| `422 Unprocessable Entity` | バリデーションエラー（Pydantic） |
| `500 Internal Server Error` | サーバー内部エラー |

**エラーレスポンス例**
```json
{
  "detail": "Article not found"
}
```

---

## CORS設定

開発環境ではすべてのオリジンを許可（`*`）。
本番環境では適切なオリジンに制限すること。
