/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['oqyzkhzmvdnkknxdmhao.supabase.co', 'api.dicebear.com'],
  },
}

export default nextConfig;
