# Use uma imagem base do Node.js
FROM node:20-buster

# Instala as dependências necessárias para o Puppeteer
RUN apt-get update && apt-get install -y \
    gconf-service \
    libgbm-dev \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# Define o diretório de trabalho no contêiner
WORKDIR /app

# Copia o arquivo package.json e yarn.lock para o diretório de trabalho
COPY package.json yarn.lock ./

# Instala as dependências da aplicação
RUN yarn install

# Copia todo o conteúdo do diretório atual para o diretório de trabalho no contêiner
COPY . .

# Compila a aplicação
RUN yarn build

# Expõe a porta que a aplicação irá rodar (ajuste conforme necessário)
EXPOSE 3000

# Define o comando para iniciar a aplicação
CMD ["yarn", "start"]
