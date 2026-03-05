// バックエンドAPIを呼び出す関数をまとめたファイル
import { Article, ArticleListResponse, ArticleCreate, ArticleUpdate, SearchResponse  } from '@/types/article'

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
        throw new Error(error.detail || `APIエラー: ${response.status}`)
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
  author?: string,
  q?: string,
  sortBy?: string,
  order?: string,
  titleOnly?: boolean,
): Promise<ArticleListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    ...(category && { category }),
    ...(author && { author }),
    ...(q && { q }),
    ...(sortBy && { sort_by: sortBy }),
    ...(order && { order }),
    ...(titleOnly && { title_only: 'true' }),
  })
  return fetchAPI<ArticleListResponse>(`/articles?${params}`)
}

// カテゴリ一覧取得
export async function getCategories(): Promise<string[]> {
  return fetchAPI<string[]>('/articles/categories')
}

// 著者一覧取得
export async function getAuthors(): Promise<string[]> {
  return fetchAPI<string[]>('/articles/authors')
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

export async function searchArticles(
  query: string,
  threshold: number = 0.5,
  limit: number = 20,
  page: number = 1,
  category?: string,
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    threshold: threshold.toString(),
    limit: limit.toString(),
    page: page.toString(),
    ...(category && { category }),
  })
  return fetchAPI<SearchResponse>(`/articles/search?${params}`)
}

export async function getEmbeddingStatus(): Promise<{
  total: number
  completed: number
  percentage: number
}> {
  return fetchAPI('/articles/embeddings/status')
}