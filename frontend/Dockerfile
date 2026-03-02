# ベースイメージ：軽量なNode.js20環境
FROM node:20-alpine

# コンテナ内の作業ディレクトリを/appに設定
WORKDIR /app

# package.jsonを先にコピーしてキャッシュを活用
# ソースコードだけ変更した場合にnpm installが省略されビルドが速くなる
COPY package*.json ./
RUN npm install

# ソースコードをコピー
COPY . .

# CMDはコンテナ起動時に実行するコマンドを指定するものです。
CMD ["npm", "run", "dev"]

