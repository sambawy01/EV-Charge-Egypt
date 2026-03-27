export const typography = {
  // Headers — bold, tight, commanding
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 32, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.8 },
  h2: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.5 },
  h3: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 20, fontWeight: '600' as const, lineHeight: 24, letterSpacing: -0.3 },

  // Body — Space Grotesk everywhere for unified tech feel
  body: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 15, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0.1 },
  bodyBold: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, fontWeight: '600' as const, lineHeight: 22, letterSpacing: 0.1 },

  // Small text — still Space Grotesk, wider letter-spacing for readability
  caption: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 13, fontWeight: '400' as const, lineHeight: 18, letterSpacing: 0.3 },
  small: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 11, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0.4 },

  // Buttons — bold, wider spacing for that tech UI feel
  button: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.8 },

  // Data/numbers — monospaced feel
  mono: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, fontWeight: '700' as const, lineHeight: 20, letterSpacing: 0.5 },

  // Magazine/section headers — uppercase wide-spaced
  sectionLabel: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 11, fontWeight: '700' as const, lineHeight: 14, letterSpacing: 3 },
} as const;
