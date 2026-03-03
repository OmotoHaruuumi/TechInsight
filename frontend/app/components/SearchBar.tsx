//// Next.jsのApp Routerではデフォルトがサーバーコンポーネント
// useStateなどのReactフックはクライアントコンポーネントでしか使えない
// 'use client'をつけることでクライアントコンポーネントになる
'use client'

import { useState } from 'react'


// 親コンポーネントから受け取るpropsの型定義
// onSearch → 検索実行時に呼ぶ関数
// isLoading → 検索中かどうか
interface SearchBarProps {
  onSearch: (query: string, type: 'keyword' | 'semantic') => void
  isLoading: boolean
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'keyword' | 'semantic'>('keyword')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // trimはpythonのstrip
    if (query.trim()) {
      onSearch(query, searchType)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3">
        {/* 検索タイプ切り替え */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSearchType('keyword')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              searchType === 'keyword'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            キーワード検索
          </button>
          <button
            type="button"
            onClick={() => setSearchType('semantic')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              searchType === 'semantic'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            セマンティック検索
          </button>
        </div>

        {/* 検索入力 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchType === 'keyword'
                ? 'キーワードで検索...'
                : '意味で検索（例：機械学習の始め方）...'
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '検索中...' : '検索'}
          </button>
        </div>
      </div>
    </form>
  )
}