# ================================
# Stage 1: deps - 의존성 설치
# ================================
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

# ================================
# Stage 2: build - Next.js 빌드
# ================================
FROM node:22-slim AS build

WORKDIR /app

# NEXT_PUBLIC_* 은 빌드 시점에 코드에 인라인된다.
# Dokploy(Dockerfile 빌드)는 Environment 값을 build-arg 로 안 넘기므로
# 여기 기본값을 박아둔다. build-arg 가 오면 그걸로 덮어쓴다.
ARG NEXT_PUBLIC_API_URL=https://preq-api.jwkwon.dev/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# ================================
# Stage 3: production - 최종 실행 이미지
# ================================
FROM node:22-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone 출력: 서버 + 추적된 node_modules 만 포함
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
