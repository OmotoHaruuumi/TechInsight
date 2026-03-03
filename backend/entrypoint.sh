#!/bin/bash
set -e

echo "DBの起動を待機中..."
sleep 3

echo "CSVデータをインポート中..."
python scripts/seed.py

echo "APIサーバーを起動中..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
