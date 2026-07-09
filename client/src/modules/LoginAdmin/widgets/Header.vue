<template>
  <header class="absolute w-full z-20">
    <div class="w-full px-8 lg:px-16 pt-6 mx-auto flex justify-between items-center">
      <a href="/" class="flex items-center gap-3 group">
        <img src="/images/logo.png" alt="Logo Baitul Mal" class="h-12 w-auto max-w-[180px] object-contain" />
      </a>
      <a href="/" class="back-nav-btn" title="Kembali ke Halaman Utama">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span class="hidden sm:inline text-sm font-semibold">Beranda</span>
      </a>
    </div>
  </header>
</template>

<style scoped>
.back-nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 8px 16px;
  color: white;
  text-decoration: none;
  transition: all 0.2s ease;
}
.back-nav-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1px);
}
</style>
