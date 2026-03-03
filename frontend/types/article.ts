// フロントエンド全体で使う型を定義する

// 記事を表す型
export interface Article {
  id: number
  title: string
  content: string
  author: string | null
  category: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

// backendのschemas.pyと対応する型を定義する

export interface ArticleListResponse {
  articles: Article[]
  total: number
  page: number
  size: number
}

export interface ArticleCreate {
  title: string
  content: string
  author?: string
  category?: string
  published_at?: string
}

export interface ArticleUpdate {
  title?: string
  content?: string
  author?: string
  category?: string
  published_at?: string
}

export interface SearchResult {
  article: Article
  score: number
}