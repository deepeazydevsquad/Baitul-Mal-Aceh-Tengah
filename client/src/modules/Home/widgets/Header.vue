<template>
  <header class="absolute w-full z-20">
    <div class="w-full pt-6 flex items-center">

      <!-- Logo desktop: aligned exactly with Content.vue's left column -->
      <div class="hidden lg:flex w-1/2 px-8 justify-center">
        <div class="w-full max-w-[550px]">
          <a href="/" class="inline-flex items-center gap-3 group">
            <img src="/images/logo.png" alt="Logo Baitul Mal" class="h-14 w-auto object-contain sharpen-logo" />
          </a>
        </div>
      </div>

      <!-- Logo mobile/tablet -->
      <a href="/" class="lg:hidden flex items-center gap-3 ml-6">
        <img src="/images/logo.png" alt="Logo Baitul Mal" class="h-12 w-auto object-contain sharpen-logo" />
      </a>

      <!-- Admin button -->
      <div class="ml-auto pr-6 lg:pr-[75px]">
        <a href="/login-admin" class="admin-nav-btn" title="Login ke Area Administrator">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span class="hidden sm:inline text-sm font-semibold">Admin</span>
        </a>
      </div>

    </div>
  </header>
</template>

<style scoped>
.admin-nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50px;
  padding: 8px 16px;
  color: white;
  text-decoration: none;
  transition: all 0.2s ease;
}
.admin-nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}
.sharpen-logo {
  image-rendering: -moz-crisp-edges;
  image-rendering: -o-crisp-edges;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>
