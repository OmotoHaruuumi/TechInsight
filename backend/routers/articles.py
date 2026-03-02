# CRUD APIのエンドポイントを定義するファイル

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Article
from schemas import ArticleCreate, ArticleUpdate, ArticleResponse, ArticleListResponse

#ここから下の処理はすべて http://localhost:8000/articles というURLの下にぶら下がるよ、という宣言
router = APIRouter(
    prefix="/articles",
    tags=["articles"]
)

# 記事一覧取得
@router.get("", response_model=ArticleListResponse)
def get_articles(
    page: int = Query(1, ge=1), # ge=1, クエリが1以上じゃなければエラー
    size: int = Query(20, ge=1, le=100), #このサイズは１ページあたりの記事件数
    category: Optional[str] = None,
    author: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Article).filter(Article.deleted_at == None)

    # カテゴリで絞り込み
    if category:
        query = query.filter(Article.category == category)

    # 著者で絞り込み
    if author:
        query = query.filter(Article.author == author)

    total = query.count()

    articles = query.order_by(Article.created_at.desc())\
                    .offset((page - 1) * size)\
                    .limit(size)\
                    .all()

    return {
        "articles": articles,
        "total": total,
        "page": page,
        "size": size
    }

# 記事1件取得
@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article)\
                .filter(Article.id == article_id)\
                .filter(Article.deleted_at == None)\
                .first()

    if article is None:
        raise HTTPException(status_code=404, detail="記事が見つかりません")

    return article

# 記事作成
@router.post("", response_model=ArticleResponse, status_code=201)
def create_article(article: ArticleCreate, db: Session = Depends(get_db)):
    db_article = Article(**article.model_dump())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

# 記事更新
@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int,
    article: ArticleUpdate,
    db: Session = Depends(get_db)
):
    db_article = db.query(Article)\
                   .filter(Article.id == article_id)\
                   .filter(Article.deleted_at == None)\
                   .first()

    if db_article is None:
        raise HTTPException(status_code=404, detail="記事が見つかりません")

    update_data = article.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_article, key, value)

    db.commit()
    db.refresh(db_article)
    return db_article

# 記事削除（論理削除）
@router.delete("/{article_id}", status_code=204)
def delete_article(article_id: int, db: Session = Depends(get_db)):
    db_article = db.query(Article)\
                   .filter(Article.id == article_id)\
                   .filter(Article.deleted_at == None)\
                   .first()

    if db_article is None:
        raise HTTPException(status_code=404, detail="記事が見つかりません")

    # 物理削除せず論理削除
    import datetime
    db_article.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return None