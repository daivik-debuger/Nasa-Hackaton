FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .

ENV NODE_ENV=production HOST=0.0.0.0 PORT=8000
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e 'fetch("http://127.0.0.1:"+process.env.PORT+"/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'
CMD ["node", "server.js"]
