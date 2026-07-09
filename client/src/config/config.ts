/**
 * API Base URL Configuration
 *
 * - Development : langsung ke Express di port 3003
 * - Production  : melalui reverse proxy Nginx pada path /api
 *
 * Vite secara otomatis mengisi import.meta.env.DEV = true saat `npm run dev`
 * dan import.meta.env.PROD = true saat `npm run build`.
 */
export const API_URL: string = import.meta.env.DEV
  ? window.location.protocol + '//' + window.location.hostname + ':3003'
  : window.location.protocol + '//' + window.location.hostname + '/api';
