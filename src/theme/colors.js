/**
 * Light and Dark color palettes.
 * Values derived from DEEPLINK.pen design variables.
 */

export const lightColors = {
  // Primary
  primary: '#007AFF',
  primaryForeground: '#FFFFFF',

  // Brand
  brandPurple: '#5749F4',

  // Backgrounds
  background: '#FAFAFA',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#888888',
  textMuted: '#AAAAAA',

  // Status
  green: '#34C759',
  orange: '#FF9500',
  red: '#CC3314',
  purple: '#5856D6',

  // UI
  divider: '#F0F0F0',
  chipBg: '#FFFFFF',
  chipBorder: '#E5E5E5',
  inputBg: '#F5F5F5',

  // Tab
  tabActive: '#007AFF',
  tabInactive: '#AAAAAA',
  tabPillBg: '#FFFFFF',
  tabPillBorder: '#E5E5E5',

  // Agent chat
  userBubble: '#007AFF',
  userBubbleText: '#FFFFFF',
  agentBubble: '#FFFFFF',
  agentBubbleBorder: '#E5E5E5',
};

export const darkColors = {
  // Primary
  primary: '#5749F4',
  primaryForeground: '#FFFFFF',

  // Brand
  brandPurple: '#5749F4',

  // Backgrounds
  background: '#131124',
  card: '#1A182E',
  cardBorder: '#2B283D',

  // Text
  textPrimary: '#E8E8EA',
  textSecondary: '#888799',
  textMuted: '#666677',

  // Status
  green: '#34C759',
  orange: '#FF9500',
  red: '#CC3314',
  purple: '#5856D6',

  // UI
  divider: '#2B283D',
  chipBg: '#1A182E',
  chipBorder: '#2B283D',
  inputBg: '#2B283D',

  // Tab
  tabActive: '#5749F4',
  tabInactive: '#888799',
  tabPillBg: '#1A182E',
  tabPillBorder: '#2B283D',

  // Agent chat
  userBubble: '#5749F4',
  userBubbleText: '#FFFFFF',
  agentBubble: '#1A182E',
  agentBubbleBorder: '#2B283D',
};

// Default export for backward compat during migration
export const colors = lightColors;
