import { combineReducers } from 'redux';
import { yearReducer } from './slices/yearSlice';

const root = combineReducers({
  year: yearReducer,
});

export { root };
