FROM node:16

WORKDIR /app

# Copiar o arquivo de pacotes da raiz
COPY package*.json ./

# Instalar apenas as dependências do backend
RUN npm install --only=prod

# Copiar o código do backend
COPY ./BackEnd ./

# Expor a porta e iniciar a aplicação
EXPOSE 5000
CMD ["npm", "start"]
