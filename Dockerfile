FROM node:24-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server/ server/
COPY extension/ extension/
COPY LICENSE ./

USER node
EXPOSE 4000
CMD ["node", "server/index.js"]
