FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y openssl curl

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl curl

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

EXPOSE 8889

CMD [ "npm", "run", "start:prod" ]
