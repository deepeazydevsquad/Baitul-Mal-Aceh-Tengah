<template>
  <header class="absolute w-full z-20">
    <div class="w-full pt-6 flex items-center">

      <!-- Logo desktop: aligned exactly with Content.vue's left column -->
      <div class="hidden lg:flex w-1/2 px-8 justify-center">
        <div class="w-full max-w-[550px] flex justify-start">
          <a href="/" class="inline-flex items-center gap-3 group">
            <img src="/images/logo.png" alt="Logo Baitul Mal" class="h-14 w-auto object-contain sharpen-logo" />
          </a>
        </div>
      </div>

      <!-- Logo mobile/tablet -->
      <a href="/" class="lg:hidden flex items-center gap-3 ml-6">
        <img src="/images/logo.png" alt="Logo Baitul Mal" class="h-12 w-auto object-contain sharpen-logo" />
      </a>

      <!-- Admin button desktop -->
      <div class="hidden lg:flex w-1/2 px-8 justify-center">
        <div class="w-full max-w-[550px] flex justify-end">
          <router-link to="/login-admin" class="admin-nav-btn" title="Login ke Area Administrator">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </router-link>
        </div>
      </div>

      <!-- Admin button mobile/tablet -->
      <div class="lg:hidden flex ml-auto pr-6">
        <router-link to="/login-admin" class="admin-nav-btn" title="Login ke Area Administrator">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </router-link>
      </div>

    </div>
  </header>
</template>

<style scoped>
.admin-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  color: #0E561E;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(14, 86, 30, 0.08);
}
.admin-nav-btn:hover {
  background: #f0fdf4;
  color: #0b4217;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 86, 30, 0.12);
}
.admin-nav-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(14, 86, 30, 0.08);
}
.admin-nav-btn:focus-visible {
  outline: 2px solid #0E561E;
  outline-offset: 2px;
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
