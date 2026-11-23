/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/e-uniformpenabur' : '';

const nextConfig = {
  output: 'export',
  basePath: basePath,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
    domains: [
      'fxyssksvbuxnbthfrpzy.supabase.co',
      'oqyzkhzmvdnkknxdmhao.supabase.co',
      'api.dicebear.com',
      'images.unsplash.com',
    ],
  },
};

export default nextConfig;
