<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';

import { createSecureFileUrl } from '@/service/secure_file';

interface Props {
  isModalOpen: boolean;
  documentKind: string;
  documentId: number;
  tipe_pembayaran: string;
  nominal_infaq: number;
  bukti: string;
  nominal_bukti: number;
}

const props = defineProps<Props>();

const isLoading = ref(false);
const imageUrl = ref('');
const loadError = ref('');

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Function: Close modal
const closeModal = () => {
  emit('close');
};

let activeObjectUrl = '';
let loadSequence = 0;
const clearObjectUrl = () => {
  loadSequence += 1;
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
  activeObjectUrl = '';
  imageUrl.value = '';
};

watch(
  () => [props.isModalOpen, props.documentId, props.bukti],
  async ([isOpen]) => {
    clearObjectUrl();
    loadError.value = '';
    if (!isOpen || !props.documentId || !props.bukti) return;
    isLoading.value = true;
    const sequence = loadSequence;
    try {
      const field = props.tipe_pembayaran === 'transfer' ? 'bukti_transfer' : 'bukti_setoran';
      const objectUrl = await createSecureFileUrl(
        `/documents/payment/${props.documentKind}/${props.documentId}/${field}`,
      );
      if (sequence !== loadSequence || !props.isModalOpen) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      activeObjectUrl = objectUrl;
      imageUrl.value = activeObjectUrl;
    } catch {
      loadError.value = 'Bukti pembayaran tidak dapat dimuat.';
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true },
);

onBeforeUnmount(clearObjectUrl);
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    enter-to-class="opacity-100 translate-y-0 sm:scale-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
  >
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
      <div v-else class="relative max-w-xl w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">
            Display Bukti {{ props.tipe_pembayaran == 'transfer' ? 'Transfer' : 'Setoran' }}
          </h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
        <div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Nominal Infaq</label>
            <input
              type="text"
              :value="$formatToRupiah(props.nominal_infaq)"
              class="w-full bg-gray-100 border-gray-300 rounded-md p-2 mt-1"
              readonly
            />
          </div>
        </div>
        <div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Nominal {{ props.tipe_pembayaran == 'transfer' ? 'Transfer' : 'Setoran' }}</label
            >
            <input
              type="text"
              :value="$formatToRupiah(props.nominal_bukti)"
              class="w-full bg-gray-100 border-gray-300 rounded-md p-2 mt-1"
              readonly
            />
          </div>
        </div>
        <div>
          <div class="col-span-3 mt-3">
            <p class="text-sm text-gray-500 mb-2 font-medium">
              Bukti {{ props.tipe_pembayaran == 'transfer' ? 'Transfer' : 'Setoran' }} :
            </p>
            <div class="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2">
              <img
                v-if="imageUrl"
                :src="imageUrl"
                :alt="`Foto bukti ${props.tipe_pembayaran == 'transfer' ? 'Transfer' : 'Setoran'}`"
                class="object-contain w-full"
              />
              <p v-else-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <BaseButton @click="closeModal" type="button" variant="secondary"> Tutup </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>
