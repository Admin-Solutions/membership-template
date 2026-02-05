import { configureStore } from '@reduxjs/toolkit';
import {
  membershipDataReducer,
  membershipLinksReducer,
  membershipProfileReducer,
  walletProfilesReducer,
} from './membershipSlice';

export const store = configureStore({
  reducer: {
    membershipData: membershipDataReducer,
    membershipLinks: membershipLinksReducer,
    membershipProfile: membershipProfileReducer,
    walletProfiles: walletProfilesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
