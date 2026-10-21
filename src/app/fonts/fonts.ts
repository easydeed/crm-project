import localFont from 'next/font/local'

/**
 * Inter, bundled (OR-029a), and Archivo for the marketing page (OR-053). These are the exact files
 * Google Fonts serves, so rendering cannot drift, and the build never fetches from Google.
 *
 * Inter has three character ranges: latin, latin-ext and vietnamese, the scripts contact names
 * arrive in. next/font/local puts one unicode-range on every file in a call, so each range is
 * its own call and the families are stacked in globals.css. The ranges are Google's own, written out
 * in each call because next/font only reads literal values. Only the last family in each stack
 * carries the metric-matched fallback; an earlier one would catch every character first.
 * Cyrillic and Greek are not bundled and fall back to the system font. Fraunces, the marketing
 * <h1> until OR-053, is no longer bundled. Licence: OFL-*.txt.
 */
const interLatin = localFont({
  src: './inter-latin.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-inter',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
  adjustFontFallback: false,
})

const interLatinExt = localFont({
  src: './inter-latin-ext.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-inter-latin-ext',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
  adjustFontFallback: false,
  preload: false,
})

const interVietnamese = localFont({
  src: './inter-vietnamese.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-inter-vietnamese',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB',
    },
  ],
  preload: false,
})

// Archivo, the marketing page's display face (OR-053), and nothing else's. Latin only: the page's
// words are all latin; anything else falls through to Inter in the --font-display stack.
// IBM Plex Mono, the marketing page's eyebrows and vignettes (OR-054). Latin only.
const plexMono = localFont({
  src: [
    { path: './plex-mono-medium.woff2', weight: '500', style: 'normal' },
    { path: './plex-mono-semibold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-plex',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
  adjustFontFallback: false,
  preload: false,
})

const archivoLatin = localFont({
  src: './archivo-latin.woff2',
  weight: '500 900',
  style: 'normal',
  variable: '--font-archivo',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
  adjustFontFallback: false,
  preload: false,
})

/** Every font variable, for the root layout's body class. */
export const fontVariables = [
  interLatin,
  interLatinExt,
  interVietnamese,
  archivoLatin,
  plexMono,
]
  .map((font) => font.variable)
  .join(' ')
