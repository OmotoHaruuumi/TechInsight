from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import Article
from schemas import ArticleResponse
from scripts.embedding_worker import get_model, get_embedding_status
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(tags=["search"])

# 記事(ArticleResponse型)と点数を返す
class SearchResult(BaseModel):
    article: ArticleResponse
    score: float

    class Config:
        from_attributes = True

# 記事とscoreのリストと何個ヒットしたか，全部の記事数を返す
class SearchResponse(BaseModel):
    results: List[SearchResult]
    searched: int
    total: int
    total_hits: int
    page: int

# 現在どのくらいの割合embeddingが作られているかに必要な情報
class EmbeddingStatus(BaseModel):
    total: int
    completed: int
    percentage: float

# semanticサーチの指示が来た時の処理
@router.get("/search", response_model=SearchResponse)
def semantic_search(
    q: str = Query(..., min_length=1, description="検索クエリ"),
    limit: int = Query(20, ge=1, le=100, description="返す件数"),
    page: int = Query(1, ge=1),
    threshold: float = Query(0.5, ge=0.0, le=1.0, description="類似度の閾値（0.0〜1.0）"),
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # クエリをembeddingに変換
    embedding_model = get_model()
    query_embedding = embedding_model.encode([q])[0].tolist()

    # embedding生成済みの件数を取得
    searched_query = db.query(Article)\
                       .filter(Article.embedding != None)\
                       .filter(Article.deleted_at == None)
    if category:
        searched_query = searched_query.filter(Article.category == category)
    searched = searched_query.count()

    total = db.query(Article)\
              .filter(Article.deleted_at == None)\
              .count()

    # pgvectorのコサイン類似度演算子<=>で検索
    # <=> は コサイン距離（0に近いほど類似）
    # 1 - <=> でコサイン類似度（1に近いほど類似）に変換
    sql = """
        SELECT id, 1 - (embedding <=> CAST(:embedding AS vector)) AS score
        FROM articles
        WHERE embedding IS NOT NULL
        AND deleted_at IS NULL
        AND 1 - (embedding <=> CAST(:embedding AS vector)) >= :threshold
        {category_clause}
        ORDER BY embedding <=> CAST(:embedding AS vector)
    """
    params = {"embedding": str(query_embedding), "threshold": threshold}
    if category:
        sql = sql.format(category_clause="AND category = :category")
        params["category"] = category
    else:
        sql = sql.format(category_clause="")

    results = db.execute(text(sql), params).fetchall()

    # Python側でページネーション
    total_hits = len(results)
    start = (page - 1) * limit
    end = start + limit
    paged_results = results[start:end]

    # 記事の詳細を取得（ページ分のみ）
    article_ids = [r.id for r in paged_results]
    scores = {r.id: r.score for r in results}

    articles = db.query(Article)\
                 .filter(Article.id.in_(article_ids))\
                 .all()

    # スコア順に並び替え
    articles_sorted = sorted(articles, key=lambda a: scores[a.id], reverse=True)

    return {
        "results": [
            {"article": a, "score": scores[a.id]}
            for a in articles_sorted
        ],
        "searched": searched,
        "total": total,
        "total_hits": total_hits,
        "page": page,
    }

@router.get("/embeddings/status", response_model=EmbeddingStatus)
def embedding_status():
    return get_embedding_status()