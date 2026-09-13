/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // ponytail: Cloudflare Pages 호환. @cloudflare/next-on-pages가 build/_worker.js를 생성.
  // Edge runtime 기본. Node runtime 라우트는 명시적으로 export const runtime = 'nodejs' 표기.
  // nodejs_compat 플래그로 Node API 사용 가능 (Supabase, crypto 등).
};

export default nextConfig;
