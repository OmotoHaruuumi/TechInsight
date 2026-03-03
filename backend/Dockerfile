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

# entrypoint.shに実行権限を付与
RUN chmod +x entrypoint.sh

# entrypoint.shを起動時に実行
CMD ["./entrypoint.sh"]