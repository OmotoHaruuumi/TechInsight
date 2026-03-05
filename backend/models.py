from sqlalchemy import Column, Integer, String, Text, DateTime, func
from pgvector.sqlalchemy import Vector
from database import Base
import datetime

class Article(Base):
    __tablename__ = "articles"

    # 主キー
    id = Column(Integer, primary_key=True, index=True)

    # 記事情報
    # indexとして使いたいものはtextではなくstringにする
    title = Column(String(500), nullable=False, index=True)
    content = Column(Text, nullable=False)
    author = Column(String(255), nullable=True, index=True)
    category = Column(String(255), nullable=True, index=True)
    published_at = Column(DateTime, nullable=True)

    # ベクトル検索用（sentence-transformersで生成する埋め込みベクトル）
    embedding = Column(Vector(384), nullable=True)

    # タイムスタンプ
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # 論理削除用, これがnullのものだけを取り出す．物理的には削除しない
    deleted_at = Column(DateTime, nullable=True)