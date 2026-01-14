import { create } from 'zustand';


export const theme = {
  colors: {
    background: '#09090b', // Very dark grey/black
    primary: '#fafafa',    // Almost white
    secondary: '#71717a',  // Mid-grey
    button: {
      primary: '#fafafa',
      secondary: '#27272a', // Dark grey
    },
    text: {
      primary: '#fafafa',
      secondary: '#a1a1aa', // Light grey
    }
  }
};


interface ThemeState {
  currentTheme: typeof theme;
}

export const useThemeStore = create<ThemeState>((set) => ({
  currentTheme: theme,
}));
