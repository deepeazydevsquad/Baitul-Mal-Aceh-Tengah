<template>
  <div class="flex flex-col gap-6 w-full">
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-full sm:max-w-md">
      <div class="text-gray-700 text-sm md:text-base font-semibold whitespace-nowrap">
        Tahun Anggaran:
      </div>
      <div class="relative w-full sm:w-auto">
        <select
          class="appearance-none h-fit py-2.5 pl-4 pr-10 block w-full bg-white border border-gray-200 rounded-xl text-sm md:text-base font-medium shadow-sm hover:border-green-300 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <option selected>2025</option>
          <option>2024</option>
          <option>2023</option>
          <option>2022</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>

    <div class="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
      <!-- Card 1 -->
      <div
        class="group flex-1 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up delay-100"
      >
        <div class="px-5 pt-6 pb-5 flex justify-between items-start">
          <div class="flex flex-col gap-2">
            <div class="text-neutral-900 text-3xl font-bold tracking-tight">
              1
            </div>
            <div class="text-neutral-800 text-sm font-medium uppercase tracking-wide opacity-90">
              Jumlah Muzakki
            </div>
          </div>
          <div class="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform duration-300">
            <img src="/images/icon_muzakki.svg" class="w-7 h-7" alt="Icon" />
          </div>
        </div>
        <a
          href="#"
          class="px-5 py-3 bg-black/10 hover:bg-black/20 flex justify-center items-center gap-2 transition-colors duration-300"
        >
          <span class="text-neutral-900 text-sm font-semibold">
            Info Muzakki
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5 text-neutral-900 transform group-hover:translate-x-1 transition-transform duration-300"
          >
            <path
              fill-rule="evenodd"
              d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
              clip-rule="evenodd"
            />
          </svg>
        </a>
      </div>

      <!-- Card 2 -->
      <div
        class="group flex-1 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up delay-200"
      >
        <div class="px-5 pt-6 pb-5 flex justify-between items-start">
          <div class="flex flex-col gap-2">
            <div class="text-neutral-900 text-3xl font-bold tracking-tight">
              3
            </div>
            <div class="text-neutral-800 text-sm font-medium uppercase tracking-wide opacity-90">
              Jumlah Mustahiq
            </div>
          </div>
          <div class="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform duration-300">
            <img src="/images/icon_mustahiq.svg" class="w-7 h-7" alt="Icon" />
          </div>
        </div>
        <a
          href="#"
          class="px-5 py-3 bg-black/10 hover:bg-black/20 flex justify-center items-center gap-2 transition-colors duration-300"
        >
          <span class="text-neutral-900 text-sm font-semibold">
            Info Mustahiq
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5 text-neutral-900 transform group-hover:translate-x-1 transition-transform duration-300"
          >
            <path
              fill-rule="evenodd"
              d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
              clip-rule="evenodd"
            />
          </svg>
        </a>
      </div>

      <!-- Card 3 -->
      <div
        class="group flex-1 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up delay-300"
      >
        <div class="px-5 pt-6 pb-5 flex justify-between items-start">
          <div class="flex flex-col gap-2">
            <div class="text-neutral-900 text-2xl lg:text-3xl font-bold tracking-tight truncate max-w-[150px] lg:max-w-[200px]" title="Rp. 2.700.000">
              Rp. 2.700.000
            </div>
            <div class="text-neutral-800 text-sm font-medium uppercase tracking-wide opacity-90">
              Jumlah Pengumpulan
            </div>
          </div>
          <div class="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300">
            <img src="/images/icon_program1.svg" class="w-7 h-7" alt="Icon" />
          </div>
        </div>
        <a
          href="#"
          class="px-5 py-3 bg-black/10 hover:bg-black/20 flex justify-center items-center gap-2 transition-colors duration-300"
        >
          <span class="text-neutral-900 text-sm font-semibold">
            Info Pengumpulan
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5 text-neutral-900 transform group-hover:translate-x-1 transition-transform duration-300"
          >
            <path
              fill-rule="evenodd"
              d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
              clip-rule="evenodd"
            />
          </svg>
        </a>
      </div>

      <!-- Card 4 -->
      <div
        class="group flex-1 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up delay-400"
      >
        <div class="px-5 pt-6 pb-5 flex justify-between items-start">
          <div class="flex flex-col gap-2">
            <div class="text-neutral-900 text-2xl lg:text-3xl font-bold tracking-tight truncate max-w-[150px] lg:max-w-[200px]" title="Rp. 5.100.000">
              Rp. 5.100.000
            </div>
            <div class="text-neutral-800 text-sm font-medium uppercase tracking-wide opacity-90">
              Jumlah Distribusi
            </div>
          </div>
          <div class="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300">
            <img src="/images/icon_bantuan_tersalurkan.svg" class="w-7 h-7" alt="Icon" />
          </div>
        </div>
        <a
          href="#"
          class="px-5 py-3 bg-black/10 hover:bg-black/20 flex justify-center items-center gap-2 transition-colors duration-300"
        >
          <span class="text-neutral-900 text-sm font-semibold">
            Info Distribusi
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5 text-neutral-900 transform group-hover:translate-x-1 transition-transform duration-300"
          >
            <path
              fill-rule="evenodd"
              d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
              clip-rule="evenodd"
            />
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
</style>