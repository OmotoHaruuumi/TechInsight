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
- **フィルタリング**: カテゴリ・著者でのチップ選択による絞り込み（組み合わせ可）
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

---

## 工夫点・実装

### DB設計

**インデックス設計（1万件対応）**
検索に使用する `title`・`author`・`category` カラムにのみインデックスを張り、書き込み時のオーバーヘッドを最小限に抑えた。`embedding` カラムはpgvectorの演算子（`<=>`）で対応し、将来的にIVFFlat / HNSWインデックスを追加することでさらなる高速化も可能な設計にしている。

**pgvectorによるベクトルカラムの同一テーブル管理**
セマンティック検索用の384次元ベクトルを記事テーブルに同居させることで、JOIN不要のシンプルなクエリで類似検索を実現している。コサイン類似度の計算もDB側で行うため、Python側でのループ処理より高速。

**論理削除（`deleted_at` カラム）**
物理削除ではなく `deleted_at` に削除日時をセットする論理削除を採用。削除済みデータが残るため復元が容易で、監査ログとしても機能する。

**3種の日時カラムの役割分担**
`published_at`（元記事の公開日）・`created_at`（システムへの登録日）・`updated_at`（最終更新日）と役割を明確に分けることで、「元記事の公開日順での並び替え」と「システムへの登録順での管理」を両立できる設計にした。

**Alembicによるマイグレーション管理**
スキーマ変更を履歴として管理し、チームメンバーが同じDB状態を再現できるようにしている。

**コネクションプールの設定**
リクエストのたびにDB接続を作り直すコストを削減するため、SQLAlchemyのコネクションプールを設定（base: 10 / max_overflow: 20）。また接続断時の自動再接続も有効にしている。

---

### API設計

**RESTfulな設計とHTTPステータスコードの適切な使い分け**
作成時は `201 Created`、削除時は `204 No Content`、存在しないリソースへのアクセスは `404 Not Found` を返すことで、フロントエンドが状態を正確に判断できる設計にした。エラーレスポンスの形式も `{"detail": "..."}` に統一している。

**Swagger UIの自動生成**
FastAPIの強みであるOpenAPI準拠の自動ドキュメント（`/docs`）により、フロントエンドエンジニアがAPIの仕様をコードを読むだけで把握できる。`schemas.py` での型定義が直接ドキュメントに反映される。

**ページネーション（大量データへの対応）**
記事一覧をページ単位で返す設計により、データが増えてもフロントエンドが重くならない。1万件を一度に返すことなく、`page` / `size` パラメータで柔軟に制御できる。

**部分更新（PATCH的なPUT）**
PUTエンドポイントでは送られてきたフィールドのみを更新し、省略されたフィールドは変更しない設計にすることで、フロントエンドの実装コストを下げている。

**APIバージョニング（`/api/v1`）**
URLに `/api/v1` を含めることで、将来APIの仕様を大きく変える際に `/api/v2` として新しいAPIを追加でき、既存のフロントエンドを壊さずに段階移行が可能。

---

### UI/UX設計

**キーワード検索とセマンティック検索の切り替え**
通常のキーワードマッチングと、ベクトル埋め込みによる意味的類似検索を1つのUIで切り替えられる。セマンティック検索では類似度スコアをカード上に表示することで、「なぜこの記事が表示されているか」をユーザーが直感的に理解できる。

**ローディング・フィードバック制御**
検索中はボタンを非活性化してスピナーを表示し、二重送信を防止。検索結果0件時は「記事が見つかりませんでした」と明示する。

**モーダルでの記事詳細表示**
一覧ではテキストを省略表示（`…`）し、詳細はモーダルで表示。モーダルのヘッダーを固定することで、長い記事をスクロールしても編集・削除・閉じるボタンに常にアクセスできる。

**フォームコンポーネントの再利用**
作成と編集で同じ `ArticleForm` コンポーネントを使い回すことで、バリデーションロジックやUIの二重管理を排除し、メンテナンスコストを低減した。

**レスポンシブ対応・ソート・フィルタ**
画面幅に応じて1〜3カラムのグリッドレイアウトを切り替え。カテゴリ・著者でのフィルタリングと、作成日・公開日・タイトルでのソートを組み合わせて使えるようにした。

---

### チーム開発・保守運用

**ブランチ戦略**
`main`（公開用）・`develop`（統合ブランチ）・`feature/*`（作業ブランチ）の3層構造を採用。機能ごとにブランチを分けることでコンフリクトを局所化し、レビューの粒度を適切に保てる。

```
feature/docker-setup      → 環境構築
feature/db-schema         → DB設計・マイグレーション
feature/backend-crud      → CRUD API実装
feature/backend-search    → セマンティック検索実装
feature/frontend-articles → 記事一覧・詳細UI
feature/frontend-crud     → 記事管理UI
feature/seed-data         → CSVデータ投入
docs/readme               → README・設計書
```

**環境変数の管理（`.env` / `.env.example`）**
DBのパスワードなど機密情報は `.env` に分離してGitから除外し、`.env.example` だけを公開することで、「どの変数を設定すればよいか」はコードから分かる設計にした。

**型定義の徹底（TypeScript / Pydantic）**
フロントエンドはTypeScript、バックエンドはPydanticの `schemas.py` で型を明示することで、APIの入出力をコードを読むだけで把握できる。フロントエンドエンジニアとバックエンドエンジニアの認識齟齬を防ぐ。

**Docker Composeによる環境再現性**
`db`・`backend`・`frontend` の3サービスをDocker Composeで管理し、`docker compose up --build` だけで全員が同じ環境を再現できる。`healthcheck` でDBの起動を待ってからバックエンドが立ち上がる制御も入れている。

**Dockerfileのレイヤーキャッシュ最適化**
`requirements.txt` のCOPY → `pip install` → その他ソースのCOPYの順にすることで、ソースコードを変更してもライブラリの再インストールが発生しない。`.dockerignore` でビルドコンテキストを小さくしてビルド時間も短縮している。

**DBとAPIとフロントの責務分離（`models.py` / `schemas.py`）**
SQLAlchemyの `models.py`（DB層）とPydanticの `schemas.py`（API層）を分離することで、DBスキーマの変更がAPIレスポンスに直接影響しない疎結合な設計になっている。

**バックグラウンドでの埋め込み生成**
セマンティック検索用のベクトル生成をバックグラウンドワーカーがバッチ処理で行うことで、記事の定期追加・大量データ移行・埋め込みモデルの更新時においても、キーワード検索や記事一覧などの主要機能をユーザーが待たずに使い続けられる。フロントエンドには生成進捗をプログレスバーで表示している。
