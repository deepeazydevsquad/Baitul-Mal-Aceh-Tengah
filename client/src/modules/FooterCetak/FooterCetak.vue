<template>
  <footer
    class="footer-laporan flex justify-between items-center mt-6 pt-3 border-t border-gray-300 text-xs text-gray-700"
  >
    <!-- Kiri: Logo -->
    <div class="flex flex-col items-center justify-center gap-1">
      <img
        src="../../../public/images/ziwah.png"
        alt="Logo ZIWAH"
        class="h-7 object-contain print:h-5"
      />
      <span class="font-bold text-warning text-xs print:text-[10px] uppercase text-center">
        KABUPATEN ACEH TENGAH
      </span>
    </div>

    <!-- Tengah: Tanggal cetak -->
    <div class="text-center flex-1">
      <p class="text-[8pt] text-gray-600">Dicetak pada: {{ tanggalCetak }}</p>
    </div>

    <!-- Kanan: Nomor halaman -->
    <div class="text-right"></div>
  </footer>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';

const tanggalCetak = computed(() => {
  const now = new Date();
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);
});

// 🧠 Fungsi assign nomor halaman
function assignPageNumbers() {
  const pages = document.querySelectorAll('.print-area');
  pages.forEach((page, index) => {
    const pageNum = page.querySelector('.page-number');
    if (pageNum) {
      pageNum.textContent = (index + 1).toString(); // Mulai dari 1
    }
  });
}

onMounted(async () => {
  await nextTick();

  // Tunggu DOM + chart render dulu
  setTimeout(() => {
    assignPageNumbers();

    // Tambah event untuk print popup
    window.addEventListener('beforeprint', assignPageNumbers);
  }, 500);
});
</script>

<style scoped>
.footer-laporan {
  page-break-inside: avoid;
}

/* Saat print */
@media print {
  .footer-laporan {
    position: fixed;
    bottom: 5mm;
    left: 5mm;
    right: 5mm;
    background: white;
    padding-top: 8px;
    border-top: 1px solid #d1d5db;
    z-index: 1000;
  }
}

/* Saat tampil di layar */
@media screen {
  .footer-laporan {
    margin-top: 1.5rem;
  }
}
</style>
