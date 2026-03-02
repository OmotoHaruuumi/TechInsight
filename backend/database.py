from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 環境変数からDB接続URLを取得
DATABASE_URL = os.getenv("DATABASE_URL")

# DBエンジンの作成
# アプリとデータベースを物理的に繋ぐパイプ
# pool_pre_ping=TrueはDB接続が切れた場合に自動で再接続する
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# セッションの作成
# FastAPIが注文を取るための専用のオーダー用紙
# autocommit=False：明示的にcommitするまでDBに反映しない
# autoflush=False：明示的にflushするまでDBに送信しない
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# モデルの基底クラス
# データを保存する箱（テーブル）の共通の型
Base = declarative_base()

# DBセッションを提供する関数
# APIのエンドポイントにDBセッションを渡す関数
# FastAPIのDependency Injectionで使う
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()