import api from '@/service/api_administrator'

export const get_wakalah = async (param: any) => {
  try {
    const response = await api.post('/wakalah/list', param)
    return response.data
  } catch (error) {
    console.error('Gagal mengambil wakalah:', error)
    throw error
  }
}

export const list_wakalah = async () => {
  try {
    const response = await api.post('/wakalah/list', { perpage: 9999, pageNumber: 1 })
    return response.data
  } catch (error) {
    console.error('Gagal mengambil daftar wakalah:', error)
    throw error
  }
}

export const add_wakalah = async (param: any) => {
  try {
    const response = await api.post('/wakalah/add', param)
    return response.data
  } catch (error) {
    console.error('Gagal menambahkan wakalah:', error)
    throw error
  }
}

export const get_info_edit_wakalah = async (id: number) => {
  try {
    const response = await api.post('/wakalah/get_info_edit_wakalah', { id: id })
    return response.data
  } catch (error) {
    console.error('Gagal mengambil informasi wakalah:', error)
    throw error
  }
}

export const edit_wakalah = async (param: any) => {
  try {
    const response = await api.post(`/wakalah/edit`, param)
    return response.data
  } catch (error) {
    console.error('Gagal mengedit wakalah:', error)
    throw error
  }
}

export const delete_wakalah = async (id: number) => {
  try {
    const response = await api.post(`/wakalah/delete`, { id: id })
    return response.data
  } catch (error) {
    console.error('Gagal menghapus wakalah:', error)
    throw error
  }
}
