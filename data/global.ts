export const dev = process.env.NODE_ENV !== 'production';
export const BACKEND_URL = dev ? 'http://localhost:8102' : 'https://pack2.elfidc.com';
