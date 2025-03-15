/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@uiw/react-md-editor', '@uiw/react-markdown-preview'],
  webpack: (config) => {
    // 移除之前的别名配置
    return config;
  },
}

module.exports = nextConfig