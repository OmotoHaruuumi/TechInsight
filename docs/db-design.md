# 簡易DB設計書

## 概要

- **DBMS**: PostgreSQL 16
- **拡張機能**: pgvector（ベクトル類似検索）
- **ORM**: SQLAlchemy 2.0

---

## テーブル一覧

| テーブル名 | 概要 |
|-----------|------|
| articles | 記事情報（本システムの主テーブル） |

---

## テーブル定義

### articles テーブル

記事の本文・メタ情報・セマンティック検索用ベクトルを管理する。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | INTEGER | NOT NULL | auto increment | 主キー |
| `title` | VARCHAR(500) | NOT NULL | - | 記事タイトル |
| `content` | TEXT | NOT NULL | - | 記事本文 |
| `author` | VARCHAR(255) | NULL | NULL | 著者名 |
| `category` | VARCHAR(255) | NULL | NULL | カテゴリ |
| `published_at` | TIMESTAMP | NULL | NULL | 公開日時 |
| `embedding` | VECTOR(384) | NULL | NULL | セマンティック検索用ベクトル（384次元） |
| `created_at` | TIMESTAMP | NOT NULL | NOW() | 作成日時 |
| `updated_at` | TIMESTAMP | NOT NULL | NOW() | 更新日時 |
| `deleted_at` | TIMESTAMP | NULL | NULL | 削除日時（論理削除用） |

#### 制約・インデックス

| 種別 | 対象カラム | 目的 |
|------|-----------|------|
| PRIMARY KEY | `id` | 一意識別 |
| INDEX | `title` | タイトル検索の高速化 |
| INDEX | `author` | 著者フィルタリングの高速化 |
| INDEX | `category` | カテゴリフィルタリングの高速化 |

---

## 論理削除について

`deleted_at` カラムに削除日時をセットすることで論理削除を実現する。
物理削除は行わない。すべてのクエリで `deleted_at IS NULL` を条件に含めることで削除済みレコードを除外する。

---

## ベクトル埋め込みについて

- モデル: `sentence-transformers/all-MiniLM-L6-v2`
- 次元数: 384
- 生成タイミング: バックグラウンドワーカーがバッチ処理で自動生成（`EMBEDDING_BATCH_SIZE=8`）
- 類似度計算: コサイン類似度（pgvectorの `<=>` 演算子）

```
-- 類似度検索クエリ例
SELECT *, 1 - (embedding <=> query_vector) AS similarity
FROM articles
WHERE deleted_at IS NULL
  AND 1 - (embedding <=> query_vector) >= 0.5
ORDER BY embedding <=> query_vector
LIMIT 20;
```

---

## ER図（テキスト表現）

```
┌─────────────────────────────────────┐
│              articles               │
├──────────────┬──────────┬───────────┤
│ id           │ INTEGER  │ PK        │
│ title        │ VARCHAR  │ NOT NULL  │
│ content      │ TEXT     │ NOT NULL  │
│ author       │ VARCHAR  │ nullable  │
│ category     │ VARCHAR  │ nullable  │
│ published_at │ TIMESTAMP│ nullable  │
│ embedding    │ VECTOR   │ nullable  │
│ created_at   │ TIMESTAMP│ NOT NULL  │
│ updated_at   │ TIMESTAMP│ NOT NULL  │
│ deleted_at   │ TIMESTAMP│ nullable  │
└──────────────┴──────────┴───────────┘
```

> 現バージョンはシングルテーブル構成。カテゴリ・著者は文字列として記事テーブルに保持する。
