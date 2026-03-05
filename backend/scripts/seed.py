import csv
import sys
import os
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
        # 既にデータが存在する場合はスキップ
        # これによってdocker compose upを2回実行してもデータが重複しない
        existing = db.query(Article).count()
        if existing > 0:
            print(f"既に{existing}件のデータが存在します。スキップします。")
            return

        # CSVファイルのパスを取得
        csv_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "..",
            "articles.csv"
        )

        if not os.path.exists(csv_path):
            print(f"CSVファイルが見つかりません: {csv_path}")
            return

        articles = []
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                article = Article(
                    title=row["title"],
                    content=row["content"],
                    author=row["author"] or None,
                    category=row["category"] or None,
                    published_at=parse_datetime(row["published_at"]),
                )
                articles.append(article)

        # バルクインサートで一括登録することでDBアクセスを数回で済ます
        db.bulk_save_objects(articles)
        db.commit()

        print(f"{len(articles)}件のデータをインポートしました。")

    except Exception as e:
        db.rollback()
        print(f"エラーが発生しました: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()