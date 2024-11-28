# Etapa de build
FROM node:16 AS build-stage

WORKDIR /app

# Copiar o arquivo de pacotes da raiz
COPY package*.json ./

# Instalar apenas as dependências do frontend
RUN npm install --only=prod

# Copiar o código-fonte do frontend
COPY ./src

# Build da aplicação React
RUN npm run build

# Etapa para usar NGINX para servir os arquivos estáticos
FROM nginx:alpine
COPY --from=build-stage /app/build /usr/share/nginx/html

EXPOSE 80
