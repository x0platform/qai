FROM mcr.microsoft.com/playwright:v1.65.1-noble

ENV CI=true \
    HEADLESS=true \
    NODE_ENV=test \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update \
    && apt-get install -y --no-install-recommends xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/web/package.json packages/web/
COPY packages/api/package.json packages/api/
COPY apps/test-app/package.json apps/test-app/

RUN npm ci --no-audit --no-fund

COPY . .

RUN mkdir -p reports/junit reports/playwright-html reports/playwright-json

CMD ["npm", "run", "test:ci"]
