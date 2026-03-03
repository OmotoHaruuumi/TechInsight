// メインページ
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Article, ArticleCreate, ArticleUpdate } from '@/types/article'
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  searchArticles,
} from '@/lib/api'
import ArticleCard from '@/app/components/ArticleCard'
import ArticleModal from '@/app/components/ArticleModal'
import ArticleForm from '@/app/components/ArticleForm'
import SearchBar from '@/app/components/SearchBar'


export default function Home() {
  {/* 記事一覧の状態 */}
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [searchScores, setSearchScores] = useState<Record<number, number>>({})

  {/* モーダルの状態 */}
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [editArticle, setEditArticle] = useState<Article | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const PAGE_SIZE = 20

  {/* 記事一覧を取得する */}
  // 無限ループしないように関数をメモ化する
  const fetchArticles = useCallback(async (currentPage: number) => {
    setIsLoading(true)
    try {
      const data = await getArticles(currentPage, PAGE_SIZE)
      setArticles(data.articles)
      setTotal(data.total)
      setSearchScores({})
    } catch (error) {
      console.error('記事の取得に失敗しました', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  {/* 初回レンダリング時に記事を取得する */}
  useEffect(() => {
    fetchArticles(page)
  }, [page, fetchArticles])

  {/* 検索処理 */}
  const handleSearch = async (query: string, type: 'keyword' | 'semantic') => {
    setIsLoading(true)
    try {
      if (type === 'semantic') {
        const results = await searchArticles(query)
        setArticles(results.map((r) => r.article))
        setTotal(results.length)
        const scores: Record<number, number> = {}
        results.forEach((r) => { scores[r.article.id] = r.score })
        setSearchScores(scores)
      } else {
        const data = await getArticles(1, PAGE_SIZE, undefined, undefined)
        setArticles(data.articles.filter((a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.content.toLowerCase().includes(query.toLowerCase())
        ))
        setSearchScores({})
      }
    } catch (error) {
      console.error('検索に失敗しました', error)
    } finally {
      setIsLoading(false)
    }
  }

  {/* 記事作成処理 */}
  const handleCreate = async (data: ArticleCreate | ArticleUpdate) => {
    setIsLoading(true)
    try {
      await createArticle(data as ArticleCreate)
      setIsFormOpen(false)
      fetchArticles(1)
      setPage(1)
    } catch (error) {
      console.error('記事の作成に失敗しました', error)
    } finally {
      setIsLoading(false)
    }
  }

  {/* 記事更新処理 */}
  const handleUpdate = async (data: ArticleCreate | ArticleUpdate) => {
    if (!editArticle) return
    setIsLoading(true)
    try {
      await updateArticle(editArticle.id, data as ArticleUpdate)
      setEditArticle(null)
      setSelectedArticle(null)
      fetchArticles(page)
    } catch (error) {
      console.error('記事の更新に失敗しました', error)
    } finally {
      setIsLoading(false)
    }
  }

  {/* 記事削除処理 */}
  const handleDelete = async (id: number) => {
    if (!confirm('この記事を削除しますか？')) return
    setIsLoading(true)
    try {
      await deleteArticle(id)
      setSelectedArticle(null)
      fetchArticles(page)
    } catch (error) {
      console.error('記事の削除に失敗しました', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Tech<span className="text-blue-600">Insight</span>
          </h1>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + 記事を作成
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 検索バー */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* 件数表示 */}
        <div className="mb-4 text-sm text-gray-500">
          {total}件の記事
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="flex justify-center py-12">
            {/* 検索中はローディングスピナー*/}
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* 記事一覧 */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                score={searchScores[article.id]}
                onClick={setSelectedArticle}
                onEdit={(a) => setEditArticle(a)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* 記事が0件のとき */}
        {!isLoading && articles.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            記事が見つかりませんでした
          </div>
        )}

        {/* ページネーション */}
        {!isLoading && total > PAGE_SIZE && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              前へ
            </button>
            <span className="px-4 py-2 text-gray-600">
              {page} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              次へ
            </button>
          </div>
        )}
      </div>

      {/* 記事詳細モーダル */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onEdit={(a) => {
            setEditArticle(a)
            setSelectedArticle(null)
          }}
          onDelete={handleDelete}
        />
      )}

      {/* 記事作成フォーム */}
      {isFormOpen && (
        <ArticleForm
          onSubmit={handleCreate}
          onClose={() => setIsFormOpen(false)}
          isLoading={isLoading}
        />
      )}

      {/* 記事編集フォーム */}
      {editArticle && (
        <ArticleForm
          article={editArticle}
          onSubmit={handleUpdate}
          onClose={() => setEditArticle(null)}
          isLoading={isLoading}
        />
      )}
    </main>
  )
}