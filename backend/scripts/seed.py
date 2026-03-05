import csv
import sys
import os
import hashlib
from datetime import datetime

# backendディレクトリをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import SessionLocal, engine, Base
from models import Article

def parse_datetime(dt_str: str):
    """文字列をdatetimeに変換する"""
    if not dt_str:
        return None
    try:
        return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None

def seed():
    # pgvector拡張を有効化してからテーブルを作成する
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    # テーブルが存在しない場合は作成
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # CSVファイルのパスを取得
        csv_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "..",
            "articles.csv"
        )

        if not os.path.exists(csv_path):
            print(f"CSVファイルが見つかりません: {csv_path}")
            return

        # 既存記事の（タイトル+本文+著者）ハッシュをセットで取得（重複チェックをO(1)で行う）
        existing_hashes = {
            hashlib.sha256((row[0] + row[1] + (row[2] or "")).encode()).hexdigest()
            for row in db.query(Article.title, Article.content, Article.author).all()
        }

        articles = []
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # 同じ（タイトル+本文+著者）の記事が既にDBにあればスキップ
                row_hash = hashlib.sha256(
                    (row["title"] + row["content"] + (row["author"] or "")).encode()
                ).hexdigest()
                if row_hash in existing_hashes:
                    continue
                article = Article(
                    title=row["title"],
                    content=row["content"],
                    author=row["author"] or None,
                    category=row["category"] or None,
                    published_at=parse_datetime(row["published_at"]),
                )
                articles.append(article)

        if not articles:
            print("新規データはありません。スキップします。")
            return

        # バルクインサートで一括登録することでDBアクセスを数回で済ます
        db.bulk_save_objects(articles)
        db.commit()

        print(f"{len(articles)}件の新規データをインポートしました。")

    except Exception as e:
        db.rollback()
        print(f"エラーが発生しました: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()