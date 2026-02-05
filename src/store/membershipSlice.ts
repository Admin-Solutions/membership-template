import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  BASE_URL,
  getMembershipData,
  getMembershipLinks,
  getMembershipProfile,
  getWalletProfiles,
} from './config';
import type { ApiPayload } from './config';

interface ApiState<T> {
  loading: boolean;
  data: T | null;
  error: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialState: ApiState<any> = {
  loading: false,
  data: null,
  error: '',
};

// Async thunks
export const fetchMembershipData = createAsyncThunk(
  'membership/fetchData',
  async (payload: ApiPayload, { rejectWithValue }) => {
    try {
      const authParams = getMembershipData(payload);
      const response = await axios.post(
        `${BASE_URL}/api/universalapi/process`,
        authParams
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An error occurred');
    }
  }
);

export const fetchMembershipLinks = createAsyncThunk(
  'membership/fetchLinks',
  async (payload: ApiPayload, { rejectWithValue }) => {
    try {
      const authParams = getMembershipLinks(payload);
      const response = await axios.post(
        `${BASE_URL}/api/universalapi/process`,
        authParams
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An error occurred');
    }
  }
);

export const fetchMembershipProfile = createAsyncThunk(
  'membership/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const authParams = getMembershipProfile();
      const response = await axios.post(
        `${BASE_URL}/api/universalapi/process`,
        authParams
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An error occurred');
    }
  }
);

export const fetchWalletProfiles = createAsyncThunk(
  'membership/fetchWallets',
  async (_, { rejectWithValue }) => {
    try {
      const authParams = getWalletProfiles();
      const response = await axios.post(
        `${BASE_URL}/api/universalapi/process`,
        authParams
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An error occurred');
    }
  }
);

// Slices
const membershipDataSlice = createSlice({
  name: 'membershipData',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembershipData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMembershipData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = '';
      })
      .addCase(fetchMembershipData.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        state.error = action.payload as string;
      });
  },
});

const membershipLinksSlice = createSlice({
  name: 'membershipLinks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembershipLinks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMembershipLinks.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = '';
      })
      .addCase(fetchMembershipLinks.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        state.error = action.payload as string;
      });
  },
});

const membershipProfileSlice = createSlice({
  name: 'membershipProfile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembershipProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMembershipProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = '';
      })
      .addCase(fetchMembershipProfile.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        state.error = action.payload as string;
      });
  },
});

const walletProfilesSlice = createSlice({
  name: 'walletProfiles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletProfiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWalletProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = '';
      })
      .addCase(fetchWalletProfiles.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        state.error = action.payload as string;
      });
  },
});

export const membershipDataReducer = membershipDataSlice.reducer;
export const membershipLinksReducer = membershipLinksSlice.reducer;
export const membershipProfileReducer = membershipProfileSlice.reducer;
export const walletProfilesReducer = walletProfilesSlice.reducer;
