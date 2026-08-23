# Usa un'immagine Node.js leggera
FROM node:20-alpine

# Imposta la cartella di lavoro nel container
WORKDIR /usr/src/app

# Copia i file delle dipendenze e installa
COPY package*.json ./
RUN npm install

# Copia il resto del codice
COPY . .

# Genera il client Prisma e compila il codice TypeScript
RUN npx prisma generate
RUN npm run build

# Espone la porta del server
EXPOSE 3000

# Comando di avvio
CMD ["npm", "start"]