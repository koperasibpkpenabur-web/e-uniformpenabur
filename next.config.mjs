/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/e-uniformpenabur' : '',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['oqyzkhzmvdnkknxdmhao.supabase.co', 'api.dicebear.com'],
  },
}

export default nextConfig;
