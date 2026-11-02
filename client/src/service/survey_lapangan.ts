import axios from 'axios';
import { API_URL } from '@/config/config';

const surveyApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const createSurveySession = async (access_code: string) => {
  const response = await surveyApi.post('/survey_lapangan/session', {
    access_code,
  });
  return response.data;
};

export const getInfo = async () => {
  const response = await surveyApi.post('/survey_lapangan/info', {});
  return response.data;
};

export const getInfoMember = async (params: { member_id: number }) => {
  const response = await surveyApi.post('/survey_lapangan/info_member', params);
  return response.data;
};

export const submitSurvey = async (params: FormData) => {
  const response = await surveyApi.post('/survey_lapangan/submit', params);
  return response.data;
};

export const downloadSurveySk = async (id: number) => {
  const response = await surveyApi.get(`/documents/sk/${id}`, {
    responseType: 'blob',
  });
  return response.data as Blob;
};
