// バックエンドAPIを呼び出す関数をまとめたファイル
import { Article, ArticleListResponse, ArticleCreate, ArticleUpdate, SearchResult } from '@/types/article'

// 環境変数を使ってAPIのベースURLを取得する
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'


// 全APIコールの共通処理をまとめている
// エラーハンドリング・ヘッダー設定を一箇所で管理
//  <T>はジェネリクスで呼び出し側が返り値の型を指定できる
// fetch関数が指定したURLにリクエストを送る
async function fetchAPI<T>(
    endpoint: string,
    options?: RequestInit
):Promise<T>{
    const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
        headers:{
            'Content-Type': 'application/json',
        },
        ...options
    })

    // エラーのキャッチ
    if(!response.ok){
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || 'APIエラー: ${response.status}')
    }

    // 空のときは個別対応
    if (response.status === 204) {
    return {} as T
    }

    return response.json()
}

// 記事一覧取得
export async function getArticles(
  page: number = 1,
  size: number = 20,
  category?: string,
  author?: string
): Promise<ArticleListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    ...(category && { category }),
    ...(author && { author }),
  })
  return fetchAPI<ArticleListResponse>(`/articles?${params}`)
}

// 記事1件取得
export async function getArticle(id: number): Promise<Article> {
  return fetchAPI<Article>(`/articles/${id}`)
}

// 記事作成
export async function createArticle(data: ArticleCreate): Promise<Article> {
  return fetchAPI<Article>('/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// 記事更新
export async function updateArticle(
  id: number,
  data: ArticleUpdate
): Promise<Article> {
  return fetchAPI<Article>(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// 記事削除
export async function deleteArticle(id: number): Promise<void> {
  return fetchAPI<void>(`/articles/${id}`, {
    method: 'DELETE',
  })
}

// セマンティック検索（後で実装）
export async function searchArticles(query: string): Promise<SearchResult[]> {
  return fetchAPI<SearchResult[]>(`/articles/search?q=${encodeURIComponent(query)}`)
}