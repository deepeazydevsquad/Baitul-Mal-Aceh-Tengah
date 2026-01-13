<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { getActiveRunningText, getSpeedSetting } from '@/service/running_text';

// --- State Management ---
const combinedActiveText = ref(
  'SELAMAT DATANG DI APLIKASI ZIWAH BAITUL MAL KABUPATEN BENER MERIAH',
);
const isLoading = ref(true);
const speed = ref(80);

// Ref untuk elemen teks yang akan dianimasikan
const marqueeTextRef = ref<HTMLElement | null>(null);

// State untuk kalkulasi animasi
const textWidth = ref(0);
const containerWidth = ref(0);
const animationDuration = ref(0);

const fetchData = async () => {
  try {
    isLoading.value = true;
    const response = await getActiveRunningText();
    const activeTexts = response.data;

    if (activeTexts && activeTexts.length > 0) {
      combinedActiveText.value = activeTexts
        .map((text: any) => text.content)
        .join(
          '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0',
        );
    } else {
      combinedActiveText.value = 'Tidak ada informasi untuk ditampilkan saat ini.';
    }
  } catch (error) {
    console.error('Gagal mengambil data running text:', error);
    combinedActiveText.value = 'Gagal memuat informasi.';
  } finally {
    isLoading.value = false;
  }
};

const fetchSpeedSetting = async () => {
  try {
    const response = await getSpeedSetting();
    speed.value = response.data.speed;
    console.log('[Footer.vue] Speed loaded:', speed.value);
  } catch (error) {
    console.error('Gagal mengambil pengaturan kecepatan:', error);
    speed.value = 80;
  }
};

const updateMarqueeParameters = () => {
  if (marqueeTextRef.value && marqueeTextRef.value.parentElement) {
    const container = marqueeTextRef.value.parentElement;
    textWidth.value = marqueeTextRef.value.scrollWidth;
    containerWidth.value = container.offsetWidth;

    const distance = textWidth.value + containerWidth.value;
    animationDuration.value = distance / speed.value / 0.99;

    console.log('[Footer.vue] Updated animation parameters:', {
      speed: speed.value,
      distance,
      duration: animationDuration.value,
    });
  }
};

const marqueeStyle = computed(() => {
  return {
    '--container-width': `${containerWidth.value}px`,
    '--text-width': `${textWidth.value}px`,
    '--animation-duration': `${animationDuration.value}s`,
    animation: `scroll-and-pause var(--animation-duration) linear infinite`,
  };
});

onMounted(async () => {
  await Promise.all([fetchData(), fetchSpeedSetting()]);
  if (marqueeTextRef.value && marqueeTextRef.value.parentElement) {
    const resizeObserver = new ResizeObserver(() => {
      updateMarqueeParameters();
    });
    resizeObserver.observe(marqueeTextRef.value.parentElement);
  }

  // Polling untuk update speed setiap 30 detik
  setInterval(async () => {
    await fetchSpeedSetting();
  }, 30000);
});

watch([combinedActiveText, isLoading, speed], async () => {
  await nextTick();

  requestAnimationFrame(() => {
    updateMarqueeParameters();
  });
});
</script>

<template>
  <div
    class="w-full h-24 py-3.5 bg-green-900 border-t-2 border-b-2 border-yellow-400 flex items-center overflow-hidden"
  >
    <p
      ref="marqueeTextRef"
      class="marquee-text text-white text-xl font-semibold"
      :style="marqueeStyle"
    >
      <span v-if="isLoading">Memuat informasi...</span>
      <span v-else>{{ combinedActiveText }}</span>
    </p>
  </div>
</template>

<style>
.marquee-text {
  /* Mencegah teks turun ke baris baru */
  white-space: nowrap;

  /* Posisi awal, di luar layar sebelah kanan. Menggunakan variabel CSS dari script */
  transform: translateX(var(--container-width, 100vw));

  /* Memberi tahu browser untuk mengoptimalkan perubahan transformasi */
  will-change: transform;

  /* Membuat elemen menjadi inline-block agar 'scrollWidth' bisa diukur dengan benar */
  display: inline-block;
}

/* Mendefinisikan animasi utama */
@keyframes scroll-and-pause {
  /* Mulai dari luar layar kanan */
  0% {
    transform: translateX(var(--container-width));
  }
  99% {
    transform: translateX(calc(-1 * var(--text-width)));
  }
  100% {
    transform: translateX(calc(-1 * var(--text-width)));
  }
}
</style>
