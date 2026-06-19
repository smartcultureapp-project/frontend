import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포용: 의존성 추적된 최소 실행 번들을 .next/standalone 에 생성.
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  // 브라우저 콘솔→터미널 전달을 에러만으로 제한(기본 'warn').
  // MediaPipe WASM 의 양성 경고(XNNPACK 등)로 터미널이 도배되는 것을 줄인다.
  logging: {
    browserToTerminal: "error",
  },
};

export default nextConfig;
