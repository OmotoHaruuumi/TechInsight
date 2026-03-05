# TechInsight

AI搭載のナレッジベースアプリケーション。記事のCRUD管理・キーワード検索・セマンティック（意味的類似）検索機能を提供します。

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Next.js 15 / React 19 / TypeScript / Tailwind CSS |
| バックエンド | FastAPI / Python 3.11 / SQLAlchemy 2 / Alembic |
| データベース | PostgreSQL 16 + pgvector拡張 |
| 埋め込みモデル | sentence-transformers `all-MiniLM-L6-v2`（384次元） |
| インフラ | Docker / Docker Compose |

## 主な機能

- **記事CRUD**: 記事の作成・閲覧・編集・削除（論理削除）
- **キーワード検索**: タイトル・本文の全文検索（タイトルのみモード対応）
- **セマンティック検索**: ベクトル埋め込みによる意味的類似検索（類似度スコア・閾値設定）
- **フィルタリング**: カテゴリ・著者での絞り込み
- **ソート**: 作成日・公開日・タイトルでの並び替え
- **埋め込み生成**: バックグラウンドワーカーによる自動ベクトル化（進捗表示付き）

## セットアップ

### 必要なもの

- Docker & Docker Compose

### 起動手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/OmotoHaruuumi/TechInsight.git
cd TechInsight

# 2. 環境変数ファイルを作成
cp .env.example .env
# .env を編集して DB 接続情報を設定

# 3. コンテナを起動
docker compose up --build
```

起動後、以下のURLでアクセスできます：

| サービス | URL |
|----------|-----|
| フロントエンド | http://localhost:3000 |
| バックエンドAPI | http://localhost:8000 |
| API ドキュメント | http://localhost:8000/docs |

> 初回起動時は `articles.csv` のシードデータが自動インポートされ、バックグラウンドで埋め込みベクトルが生成されます。生成の進捗はフロントエンドのプログレスバーで確認できます。

## 環境変数

| 変数名 | 説明 | 例 |
|--------|------|----|
| `POSTGRES_USER` | DBユーザー名 | `techinsight` |
| `POSTGRES_PASSWORD` | DBパスワード | `your_password` |
| `POSTGRES_DB` | DB名 | `techinsight_db` |
| `POSTGRES_PORT` | DBポート | `5432` |
| `DATABASE_URL` | SQLAlchemy接続URL | `postgresql://user:pass@db:5432/dbname` |

## ディレクトリ構成

```
TechInsight/
├── backend/               # FastAPI バックエンド
│   ├── routers/           # APIルーター（articles, search）
│   ├── scripts/           # シードスクリプト・埋め込みワーカー
│   ├── main.py            # アプリ起動・CORS設定
│   ├── models.py          # SQLAlchemy ORM モデル
│   ├── schemas.py         # Pydantic スキーマ
│   ├── database.py        # DB接続設定
│   └── requirements.txt   # Python依存関係
├── frontend/              # Next.js フロントエンド
│   ├── app/               # App Router
│   │   ├── components/    # UIコンポーネント
│   │   ├── page.tsx       # メインページ
│   │   └── layout.tsx     # ルートレイアウト
│   ├── lib/api.ts         # APIクライアント
│   └── types/article.ts   # TypeScript型定義
├── docs/                  # 設計書
│   ├── db-design.md       # DB設計書
│   └── api-design.md      # API設計書
├── articles.csv           # シードデータ
├── docker-compose.yml     # Docker Compose設定
├── .env.example           # 環境変数テンプレート
└── README.md
```

## 設計書

- [DB設計書](docs/db-design.md)
- [API設計書](docs/api-design.md)
