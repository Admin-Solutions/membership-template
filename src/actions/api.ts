import axios from 'axios';
import {
  BASE_URL,
  getMembershipData,
  getMembershipLinks,
  getMembershipProfile,
  getWalletProfiles,
} from '../store/config';
import type { ApiPayload } from '../store/config';

const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const api = {
  fetchMembershipData: async (payload: ApiPayload) => {
    const params = getMembershipData(payload);
    const res = await axiosInstance.post('/universalapi/process', params);
    return res.data;
  },

  fetchMembershipLinks: async (payload: ApiPayload) => {
    const params = getMembershipLinks(payload);
    const res = await axiosInstance.post('/universalapi/process', params);
    return res.data;
  },

  fetchMembershipProfile: async () => {
    const params = getMembershipProfile();
    const res = await axiosInstance.post('/universalapi/process', params);
    return res.data;
  },

  fetchWalletProfiles: async () => {
    const params = getWalletProfiles();
    const res = await axiosInstance.post('/universalapi/process', params);
    return res.data;
  },
};
