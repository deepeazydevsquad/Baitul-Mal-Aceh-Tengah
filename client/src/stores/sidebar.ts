import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const isSidebarOpen = ref(window.innerWidth >= 1024)
  const selected = useStorage('selected', ref('eCommerce'))
  const page = useStorage('page', ref('Dashboard'))

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  return { isSidebarOpen, toggleSidebar, selected, page }
})

export const useSelectedTab = defineStore('selectedTab', {
  state: () => ({ sharedArray: [] as any[] }),
  actions: {
    addItem(item: any) {
      this.sharedArray.push(item)
    },
    removeItem(index: number) {
      this.sharedArray.splice(index, 1)
    },
    clearArray() {
      this.sharedArray = []
    },
  },
  getters: {
    getArray: (state) => state.sharedArray,
  },
})

// menampung seluruh tab secara global
export const useGlobalTab = defineStore('globalTab', {
  state: () => ({ sharedObject: {} as Record<string, any> }),
  actions: {
    addItem(key: string, value: any) {
      this.sharedObject[key] = value
    },
    removeItem(key: string) {
      delete this.sharedObject[key]
    },
    clearObject() {
      this.sharedObject = {}
    },
  },
  getters: {
    getObject: (state) => state.sharedObject,
  },
})

// menampul string tab yang aktif
export const useGlobalActiveTab = defineStore('globalActiveTab', {
  state: () => ({ sharedString: '' }),
  actions: {
    setString(item: string) {
      this.sharedString = item
    },
    clearString() {
      this.sharedString = ''
    },
  },
  getters: {
    getString: (state) => state.sharedString,
  },
})

export const useTabTerpilih = defineStore('TabTerpilih', {
  state: () => ({ sharedNumber: 0 as number }),
  actions: {
    setNumber(item: number) {
      this.sharedNumber = item
    },
    clearNumber() {
      this.sharedNumber = 0
    },
  },
  getters: {
    getNumber: (state) => state.sharedNumber,
  },
})

export const globalSelectMenu = defineStore('selectMenu', {
  state: () => ({ sharedString: '' }),
  actions: {
    setString(item: string) {
      this.sharedString = item
    },
    clearString() {
      this.sharedString = ''
    },
  },
  getters: {
    getString: (state) => state.sharedString,
  },
})
