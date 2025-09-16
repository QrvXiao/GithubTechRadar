import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LanguageState {
  allLanguages: string[];
  selectedLanguages: string[];
  isInitialized: boolean;
}

const languageSlice = createSlice({
  name: 'language',
  initialState: {
    allLanguages: [],
    selectedLanguages: [],
    isInitialized: false,
  } as LanguageState,
  reducers: {
    setAllLanguages(state, action: PayloadAction<string[]>) {
      state.allLanguages = action.payload;
      state.selectedLanguages = action.payload;
      state.isInitialized = true;
    },
    setSelectedLanguages(state, action: PayloadAction<string[]>) {
      state.selectedLanguages = action.payload;
    },
    checkAll(state) {
      state.selectedLanguages = [...state.allLanguages];
    },
    uncheckAll(state) {
      state.selectedLanguages = [];
    },
    toggleLanguage(state, action: PayloadAction<string>) {
      const lang = action.payload;
      if (state.selectedLanguages.includes(lang)) {
        state.selectedLanguages = state.selectedLanguages.filter(l => l !== lang);
      } else {
        state.selectedLanguages = [...state.selectedLanguages, lang];
      }
    },
  },
});

export const {
  setAllLanguages,
  setSelectedLanguages,
  checkAll,
  uncheckAll,
  toggleLanguage,
} = languageSlice.actions;

const store = configureStore({
  reducer: {
    language: languageSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;