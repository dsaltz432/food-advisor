import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { root } from './root';

export const store = configureStore({
  reducer: root,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useRedux: TypedUseSelectorHook<RootState> = useSelector;
