import api from '@/service/api_administrator';

export const list_kecamatan = async () => {
  try {
    const response = await api.get('/kecamatan/list_dropdown_kecamatan');
    return response.data;
  } catch (error) {
    console.error('Error daftar kecamatan', error);
    throw error;
  }
};

export const list_desa = async (param: any) => {
  try {
    const response = await api.post('/kecamatan/list_dropdown_desa', param);
    return response.data;
  } catch (error) {
    console.error('Error daftar desa', error);
    throw error;
  }
};

export const daftar_wakalah = async (param: any) => {
  try {
    const response = await api.post('/wakalah/list', param);
    return response.data;
  } catch (error) {
    console.error('Error daftar wakalah', error);
    throw error;
  }
};

export const add_wakalah = async (param: any) => {
  try {
    const response = await api.post('/wakalah/add', param);
    return response.data;
  } catch (error) {
    console.error('Error add wakalah', error);
    throw error;
  }
};

export const update_wakalah = async (param: any) => {
  try {
    const response = await api.post('/wakalah/update', param);
    return response.data;
  } catch (error) {
    console.error('Error update wakalah', error);
    throw error;
  }
};

export const delete_wakalah = async (param: any) => {
  try {
    const response = await api.post('/wakalah/delete', param);
    return response.data;
  } catch (error) {
    console.error('Error delete wakalah', error);
    throw error;
  }
};

export const get_info_edit = async (param: any) => {
  try {
    const response = await api.post('/wakalah/get_info_edit', param);
    return response.data;
  } catch (error) {
    console.error('Error mengambil data wakalah', error);
    throw error;
  }
};
