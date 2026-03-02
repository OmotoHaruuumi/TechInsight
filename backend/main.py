from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import articles

# models.pyで定義したテーブルがDBに存在しない場合自動で作成する
Base.metadata.create_all(bind=engine)

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

# articles.pyで定義したルーターを登録
app.include_router(articles.router, prefix="/api/v1")

# ヘルスチェック用のエンドポイント
@app.get("/health")
def health():
    return {"status": "ok"}