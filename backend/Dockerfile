# ベースイメージ：軽量なPython3.11環境
FROM python:3.11-slim

# コンテナ内の作業ディレクトリを/appに設定
WORKDIR /app

# requirements.txtを先にコピーしてキャッシュを活用
# ソースコードだけ変更した場合にpip installが省略されビルドが速くなる
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ソースコードをコピー
COPY . .

# --reloadでコード変更を自動検知して再起動（開発用）
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]