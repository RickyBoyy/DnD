# Use a imagem oficial do Node.js
FROM node:20

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos package.json e package-lock.json (se houver)
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante dos arquivos do código
COPY . .

# Exponha a porta que o servidor vai usar
EXPOSE 4000  

# Comando para iniciar o servidor
CMD ["node", "gameServer.js"]  
