'use client'

import { Article } from '@/types/article'

interface ArticleModalProps {
  article: Article | null
  onClose: () => void
  onEdit: (article: Article) => void
  onDelete: (id: number) => void
}

export default function ArticleModal({
  article,
  onClose,
  onEdit,
  onDelete,
}: ArticleModalProps) {
  if (!article) return null

  return (
    <div
      // fixed inset-0 → 画面全体を覆う,  bg-black bg-opacity-50 → 半透明の黒い背景
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      // 背景がクリックされたらモーダルを閉じる
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        // モーダル本体をクリックしても背景のonCloseが発火しないようにする
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex gap-2">
            {article.category && (
              <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                {article.category}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(article)}
              className="text-sm px-3 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
            >
              編集
            </button>
            <button
              onClick={() => onDelete(article.id)}
              className="text-sm px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
            >
              削除
            </button>
            <button
              onClick={onClose}
              className="text-sm px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 leading-snug">
            {article.title}
          </h1>

          {/* メタ情報 */}
          <div className="flex gap-4 text-base text-gray-500 mb-8 border-b border-gray-100 pb-4">
            {article.author && <span>著者: {article.author}</span>}
            {article.published_at && (
              <span>
                公開日: {new Date(article.published_at).toLocaleDateString('ja-JP')}
              </span>
            )}
          </div>

          {/* 本文 */}
          <div className="text-base text-gray-700 leading-8 whitespace-pre-wrap">
            {article.content}
          </div>
        </div>
      </div>
    </div>
  )
}