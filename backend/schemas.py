# APIのリクエストとレスポンスの型を定義するファイル
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# 記事を新規作成するときにフロントから送られるデータの型
class ArticleCreate(BaseModel):
    title: str
    content: str
    author: Optional[str] = None
    category: Optional[str] = None
    published_at: Optional[datetime] = None

# 記事を更新するときにフロントから送られるデータの型
class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    published_at: Optional[datetime] = None

# APIがフロントに返すデータの型
class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    author: Optional[str] = None
    category: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# 記事一覧を返すときの型（ページネーション情報も含む）
class ArticleListResponse(BaseModel):
    articles: list[ArticleResponse]
    total: int
    page: int
    size: int