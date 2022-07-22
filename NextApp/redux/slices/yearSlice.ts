import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  value: '2022',
};

export const counterSlice = createSlice({
  name: 'year',
  initialState,
  reducers: {
    setYear: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
  },
});

export const { setYear } = counterSlice.actions;

export const yearReducer = counterSlice.reducer;
