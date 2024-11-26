export const lightTheme = {
  background: '#f3f4f6',
  text: '#111827',
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#9ca3af',
  accent: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  card: '#ffffff',
  cardHover: '#f9fafb',
  border: '#e5e7eb',
};

export const darkTheme = {
  background: '#111827',
  text: '#f9fafb',
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#9ca3af',
  accent: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  card: '#1f2937',
  cardHover: '#374151',
  border: '#374151',
};

export type Theme = typeof lightTheme;

export const getThemeColors = (isDarkMode: boolean) => {
  return isDarkMode ? darkTheme : lightTheme;
};
