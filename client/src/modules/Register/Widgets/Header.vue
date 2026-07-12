<template>
  <header class="w-full bg-white">
    <div class="w-full pt-6 pb-4 lg:pb-0 flex items-center">
      <!-- Logo desktop: aligned exactly with Home Header -->
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
    </div>
  </header>
</template>

<style scoped>
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
