from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base
from routers import articles
from routers import search


app = FastAPI(
    title="TechInsight API",
    description="AI搭載型ナレッジベースAPI",
    version="0.1.0"
)

# CORSの設定、CORSはブラウザのセキュリティ機能
# 異なるオリジン（ポート番号が違うなど）からのリクエストをデフォルトでブラウザがブロックする
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FastAPIアプリ起動時に1回だけ実行される
# テーブル作成・pgvector有効化・embedding生成開始をここで行う
@app.on_event("startup")
def startup():
    # pgvector拡張を有効化する
    with engine.connect() as conn:
        # pgvector拡張をDBで有効化する
        # IF NOT EXISTSで既に有効な場合はスキップする
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()

    # テーブルを作成する
    Base.metadata.create_all(bind=engine)

    # バックグラウンドでembedding生成を開始する
    from scripts.embedding_worker import start_embedding_worker
    import threading
    # daemon=Trueでメインプロセスが終了したらスレッドも終了する
    thread = threading.Thread(target=start_embedding_worker, daemon=True)
    thread.start()

# searchを先に登録することで/articles/searchが /articles/{article_id}より先にマッチする
app.include_router(search.router, prefix="/api/v1/articles")
app.include_router(articles.router, prefix="/api/v1")


# ヘルスチェック用のエンドポイント
@app.get("/health")
def health():
    return {"status": "ok"}