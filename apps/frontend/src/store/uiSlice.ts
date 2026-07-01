import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  searchOpen: boolean;
  mobileMenuOpen: boolean;
}

const initialState: UIState = {
  searchOpen: false,
  mobileMenuOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
  },
});

export const { setSearchOpen, setMobileMenuOpen, toggleSearch, toggleMobileMenu } =
  uiSlice.actions;
export default uiSlice.reducer;
