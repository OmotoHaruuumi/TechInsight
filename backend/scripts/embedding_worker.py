import sys
import os
import time
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Article
import threading

# 環境変数からバッチサイズを取得（デフォルト8）
BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "8"))

# モデルのロードは1回だけ行う
model = None
model_lock = threading.Lock()

def get_model():
    global model
    with model_lock:
        if model is None:
            from sentence_transformers import SentenceTransformer
            print("embeddingモデルをロード中...")
            model = SentenceTransformer('all-MiniLM-L6-v2')
            print("embeddingモデルのロード完了")
    return model


def start_embedding_worker():
    """バックグラウンドでembeddingを生成するワーカー"""
    print(f"embedding生成ワーカーを開始します（バッチサイズ: {BATCH_SIZE}）")
    
    # モデルをロード
    embedding_model = get_model()
    
    while True:
        db = SessionLocal()
        try:
            # embeddingが未生成かつ論理削除されていない記事をBATCH_SIZE件取得
            # 1つずつよりも早い
            articles = db.query(Article)\
                         .filter(Article.embedding == None)\
                         .filter(Article.deleted_at == None)\
                         .limit(BATCH_SIZE)\
                         .all()

            # 未生成の記事がなければ終了
            if not articles:
                total = db.query(Article).filter(Article.deleted_at == None).count()
                print(f"embedding生成完了: 全{total}件")
                break

            # BATCH_SIZE件分のテキストをまとめてembeddingに変換
            texts = [a.title + " " + a.content for a in articles]
            embeddings = embedding_model.encode(texts, batch_size=BATCH_SIZE)

            # DBに保存
            for article, embedding in zip(articles, embeddings):
                article.embedding = embedding.tolist()

            db.commit()

            # 進捗を表示
            completed = db.query(Article)\
                          .filter(Article.embedding != None)\
                          .filter(Article.deleted_at == None)\
                          .count()
            total = db.query(Article).filter(Article.deleted_at == None).count()
            print(f"embedding生成進捗: {completed}/{total}件 ({completed/total*100:.1f}%)")

        except Exception as e:
            db.rollback()
            print(f"embedding生成エラー: {e}")
            time.sleep(5)
        finally:
            db.close()


def get_embedding_status():
    """embedding生成の進捗を返す"""
    db = SessionLocal()
    try:
        total = db.query(Article)\
                  .filter(Article.deleted_at == None)\
                  .count()
        completed = db.query(Article)\
                      .filter(Article.embedding != None)\
                      .filter(Article.deleted_at == None)\
                      .count()
        percentage = (completed / total * 100) if total > 0 else 0
        return {
            "total": total,
            "completed": completed,
            "percentage": round(percentage, 1),
        }
    finally:
        db.close()