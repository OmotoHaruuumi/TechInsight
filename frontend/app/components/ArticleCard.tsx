'use client'

import { Article } from '@/types/article'

//セマンティック検索の際はどのくらい近いと判断したかを表示するようにする
interface ArticleCardProps {
  article: Article
  score?: number
  onClick: (article: Article) => void
  onEdit: (article: Article) => void
  onDelete: (id: number) => void
}

export default function ArticleCard({
  article,
  score,
  onClick,
  onEdit,
  onDelete,
}: ArticleCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(article)}
    >
      {/* カテゴリ・スコア */}
      <div className="flex justify-between items-center mb-2">
        {article.category && (
          <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
            {article.category}
          </span>
        )}
        {score !== undefined && (
          <span className="text-xs text-purple-600 font-medium">
            類似度: {(score * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {/* タイトル */}
      <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
        {article.title}
      </h2>

      {/* 本文プレビュー */}
      <p className="text-sm text-gray-500 line-clamp-3 mb-4">
        {article.content}
      </p>

      {/* フッター */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-400">
          {article.author && <span>{article.author}</span>}
          {article.published_at && (
            <span className="ml-2">
              {new Date(article.published_at).toLocaleDateString('ja-JP')}
            </span>
          )}
        </div>

        {/* 編集・削除ボタン */}
        <div
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(article)}
            className="text-xs px-3 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
          >
            編集
          </button>
          <button
            onClick={() => onDelete(article.id)}
            className="text-xs px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}