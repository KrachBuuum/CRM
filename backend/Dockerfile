FROM node:20-alpine
# Pi-Optimierung: Minimales Alpine-Image, ARM-kompatibel
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --prefer-offline 2>/dev/null || npm install --omit=dev
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["npm", "start"]
