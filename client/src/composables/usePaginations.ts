import { ref, computed } from 'vue';

export function usePagination(
  fetchData: () => void,
  options?: {
    perPage?: number;
    totalRow?: number;
  },
) {
  const currentPage = ref(1);
  const perPage = ref(options?.perPage ?? 10);
  const totalRow = ref(options?.totalRow ?? 0);

  // ✅ totalPages otomatis
  const totalPages = computed(() => Math.max(1, Math.ceil(totalRow.value / perPage.value)));

  function setPage(page: number) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    fetchData();
  }

  function nextPage() {
    setPage(currentPage.value + 1);
  }

  function prevPage() {
    setPage(currentPage.value - 1);
  }

  function pageNow(page: number) {
    setPage(page);
  }

  const pages = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1));

  return {
    currentPage,
    perPage,
    totalRow,
    totalPages,
    pages,
    nextPage,
    prevPage,
    pageNow,
    setPage,
  };
}
