export type EditorFontFamily = 'sans' | 'serif' | 'mono';

export interface FontFamilyOption {
  id: EditorFontFamily;
  label: string;
  cssValue: string;
  description: string;
}

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  {
    id: 'sans',
    label: 'Sans',
    cssValue: '"Instrument Sans", system-ui, -apple-system, sans-serif',
    description: 'Clean sans-serif',
  },
  {
    id: 'serif',
    label: 'Serif',
    cssValue: '"Lora", Georgia, Cambria, "Times New Roman", serif',
    description: 'Editorial serif',
  },
  {
    id: 'mono',
    label: 'Mono',
    cssValue: '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
    description: 'Fixed-width monospace',
  },
];

export function getFontFamilyOption(id: EditorFontFamily): FontFamilyOption {
  return FONT_FAMILY_OPTIONS.find((opt) => opt.id === id) ?? FONT_FAMILY_OPTIONS[0];
}

export function resolveFontFamilyCssVar(id: EditorFontFamily): string {
  return getFontFamilyOption(id).cssValue;
}

export function parseStoredFontFamily(raw: string | null | undefined): EditorFontFamily {
  if (raw === 'sans' || raw === 'serif' || raw === 'mono') {
    return raw;
  }
  return 'sans';
}
