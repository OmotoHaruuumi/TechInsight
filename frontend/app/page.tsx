// メインページ
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Article, ArticleCreate, ArticleUpdate, EmbeddingStatus} from '@/types/article'
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  searchArticles,
  getEmbeddingStatus,
  getCategories,
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
  const [searchedCount, setSearchedCount] = useState<number | null>(null)
  const [totalHits, setTotalHits] = useState<number | null>(null)

  {/* 検索の状態 */}
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'keyword' | 'semantic' | null>(null)
  const [searchThreshold, setSearchThreshold] = useState(0.5)
  const [searchPage, setSearchPage] = useState(1)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [titleOnly, setTitleOnly] = useState(false)

  {/* カテゴリフィルターの状態 */}
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  {/* 並べ替えの状態 */}
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  {/* モーダルの状態 */}
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [editArticle, setEditArticle] = useState<Article | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  {/* embedding生成進捗の状態 */}
  const [embeddingStatus, setEmbeddingStatus] = useState<EmbeddingStatus | null>(null)

  const PAGE_SIZE = 20

  {/* 記事一覧を取得する */}
  const fetchArticles = useCallback(async (currentPage: number, category: string | null, sb: string, so: string) => {
    setIsLoading(true)
    try {
      const data = await getArticles(currentPage, PAGE_SIZE, category ?? undefined, undefined, undefined, sb, so)
      setArticles(data.articles)
      setTotal(data.total)
      setSearchScores({})
      setSearchedCount(null)
      setTotalHits(null)
      setIsSearchMode(false)
    } catch (error) {
      console.error('記事の取得に失敗しました', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  {/* セマンティック検索結果を取得する */}
  const fetchSearchResults = useCallback(async (
    query: string,
    threshold: number,
    currentPage: number,
    category: string | null,
  ) => {
    setIsLoading(true)
    try {
      const data = await searchArticles(query, threshold, PAGE_SIZE, currentPage, category ?? undefined)
      setArticles(data.results.map((r) => r.article))
      setTotalHits(data.total_hits)
      setSearchedCount(data.searched)
      const scores: Record<number, number> = {}
      data.results.forEach((r) => { scores[r.article.id] = r.score })
      setSearchScores(scores)
      setIsSearchMode(true)
    } catch (error) {
      console.error('検索に失敗しました', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  {/* キーワード検索結果を取得する */}
  const fetchKeywordResults = useCallback(async (
    query: string,
    currentPage: number,
    category: string | null,
    sb: string,
    so: string,
    to: boolean,
  ) => {
    setIsLoading(true)
    try {
      const data = await getArticles(currentPage, PAGE_SIZE, category ?? undefined, undefined, query, sb, so, to)
      setArticles(data.articles)
      setTotalHits(data.total)
      setSearchScores({})
      setSearchedCount(null)
      setIsSearchMode(true)
    } catch (error) {
      console.error('キーワード検索に失敗しました', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshCategories = useCallback(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  {/* 初回レンダリング時にカテゴリ一覧を取得する */}
  useEffect(() => {
    refreshCategories()
  }, [refreshCategories])

  {/* 初回レンダリング・ページ・カテゴリ・ソート変更時に記事を取得する */}
  useEffect(() => {
    if (!isSearchMode) {
      fetchArticles(page, selectedCategory, sortBy, sortOrder)
    }
  }, [page, fetchArticles, isSearchMode, selectedCategory, sortBy, sortOrder])

  {/* 検索ページが変わったとき */}
  useEffect(() => {
    if (!isSearchMode || !searchQuery) return
    if (searchType === 'keyword') {
      fetchKeywordResults(searchQuery, searchPage, selectedCategory, sortBy, sortOrder, titleOnly)
    } else if (searchType === 'semantic') {
      fetchSearchResults(searchQuery, searchThreshold, searchPage, selectedCategory)
    }
  }, [searchPage, isSearchMode, searchQuery, searchType, searchThreshold, selectedCategory, sortBy, sortOrder, titleOnly, fetchKeywordResults, fetchSearchResults])

  {/* 5秒ごとにembedding進捗を自動更新する */}
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getEmbeddingStatus()
        setEmbeddingStatus(status)
      } catch (error) {
        console.error('embedding状態の取得に失敗しました', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  {/* 検索処理 */}
  const handleSearch = async (
    query: string,
    type: 'keyword' | 'semantic',
    threshold: number,
    to: boolean,
  ) => {
    setSearchQuery(query)
    setSearchType(type)
    setSearchThreshold(threshold)
    setSearchPage(1)
    setTitleOnly(to)
    setIsSearchMode(true)

    if (type === 'keyword') {
      await fetchKeywordResults(query, 1, selectedCategory, sortBy, sortOrder, to)
    } else {
      await fetchSearchResults(query, threshold, 1, selectedCategory)
    }
  }

  {/* カテゴリ選択処理 */}
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category)
    setPage(1)
    setSearchPage(1)
    if (isSearchMode && searchQuery) {
      if (searchType === 'keyword') {
        fetchKeywordResults(searchQuery, 1, category, sortBy, sortOrder, titleOnly)
      } else if (searchType === 'semantic') {
        fetchSearchResults(searchQuery, searchThreshold, 1, category)
      }
    } else {
      setIsSearchMode(false)
      fetchArticles(1, category, sortBy, sortOrder)
    }
  }

  {/* 全件表示に戻す処理 */}
  const handleClearSearch = () => {
    setIsSearchMode(false)
    setSearchQuery('')
    setSearchType(null)
    setPage(1)
    setSearchPage(1)
    fetchArticles(1, selectedCategory, sortBy, sortOrder)
  }

  {/* 並べ替え変更処理 */}
  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setPage(1)
    setSearchPage(1)
    if (isSearchMode && searchType === 'keyword' && searchQuery) {
      fetchKeywordResults(searchQuery, 1, selectedCategory, newSortBy, newSortOrder, titleOnly)
    } else if (!isSearchMode || searchType !== 'semantic') {
      fetchArticles(1, selectedCategory, newSortBy, newSortOrder)
    }
  }

  {/* 記事作成処理 */}
  const handleCreate = async (data: ArticleCreate | ArticleUpdate) => {
    setIsLoading(true)
    try {
      await createArticle(data as ArticleCreate)
      setIsFormOpen(false)
      setIsSearchMode(false)
      setSearchQuery('')
      setPage(1)
      refreshCategories()
      fetchArticles(1, selectedCategory, sortBy, sortOrder)
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
      refreshCategories()
      fetchArticles(page, selectedCategory, sortBy, sortOrder)
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
      refreshCategories()
      fetchArticles(page, selectedCategory, sortBy, sortOrder)
    } catch (error) {
      console.error('記事の削除に失敗しました', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sortOptions = [
    { value: 'created_at', label: '作成日' },
    { value: 'published_at', label: '公開日' },
    { value: 'title', label: 'タイトル (A-Z)' },
  ]

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
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} embeddingStatus={embeddingStatus} />
        </div>

        {/* カテゴリフィルター */}
        {categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* 件数表示・並べ替え・クリアボタン */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {isSearchMode && searchType === 'semantic' && searchedCount !== null
                ? `${totalHits}件ヒット（${searchedCount}件を検索対象）`
                : isSearchMode
                ? `${totalHits}件ヒット`
                : `${total}件の記事`
              }
            </span>
            {isSearchMode && (
              <button
                onClick={handleClearSearch}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 border border-gray-300 rounded px-2 py-0.5 hover:bg-gray-50 transition-colors"
              >
                ✕ 検索をクリア
              </button>
            )}
          </div>

          {/* 並べ替えコントロール（セマンティック検索中はグレーアウト） */}
          <div className={`flex items-center gap-2 ${isSearchMode && searchType === 'semantic' ? 'opacity-40 pointer-events-none' : ''}`}>
            <span className="text-sm text-gray-500">並べ替え:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value, sortOrder)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => handleSortChange(sortBy, sortOrder === 'desc' ? 'asc' : 'desc')}
              className="text-sm border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 transition-colors"
              title={sortOrder === 'desc' ? (sortBy === 'title' ? 'Z→A' : '新しい順') : (sortBy === 'title' ? 'A→Z' : '古い順')}
            >
              {sortOrder === 'desc' ? (sortBy === 'title' ? 'Z→A' : '↓') : (sortBy === 'title' ? 'A→Z' : '↑')}
            </button>
          </div>
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="flex justify-center py-12">
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
                keyword={isSearchMode && searchType === 'keyword' ? searchQuery : undefined}
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
        {!isLoading && (isSearchMode ? (totalHits ?? 0) : total) > PAGE_SIZE && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => isSearchMode
                ? setSearchPage((p) => Math.max(1, p - 1))
                : setPage((p) => Math.max(1, p - 1))
              }
              disabled={(isSearchMode ? searchPage : page) === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              前へ
            </button>
            <span className="px-4 py-2 text-gray-600">
              {isSearchMode ? searchPage : page} / {Math.ceil((isSearchMode ? (totalHits ?? 0) : total) / PAGE_SIZE)}
            </span>
            <button
              onClick={() => isSearchMode
                ? setSearchPage((p) => p + 1)
                : setPage((p) => p + 1)
              }
              disabled={(isSearchMode ? searchPage : page) >= Math.ceil((isSearchMode ? (totalHits ?? 0) : total) / PAGE_SIZE)}
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
