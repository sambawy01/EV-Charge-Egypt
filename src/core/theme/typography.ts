import { Platform } from 'react-native';

const systemFont = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const typography = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.5 },
  h2: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.5 },
  h3: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 20, fontWeight: '600' as const, lineHeight: 26, letterSpacing: -0.3 },
  body: { fontFamily: systemFont, fontSize: 15, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0 },
  bodyBold: { fontFamily: systemFont, fontSize: 15, fontWeight: '600' as const, lineHeight: 22, letterSpacing: 0 },
  caption: { fontFamily: systemFont, fontSize: 13, fontWeight: '400' as const, lineHeight: 18, letterSpacing: 0.1 },
  small: { fontFamily: systemFont, fontSize: 11, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0.2 },
  button: { fontFamily: systemFont, fontSize: 15, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.3 },
  mono: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 14, fontWeight: '500' as const, lineHeight: 20, letterSpacing: 0 },
} as const;
