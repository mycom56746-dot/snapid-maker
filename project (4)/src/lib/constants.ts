export const PAPER_SIZES = {
  A4: { width: 210, height: 297, label: 'A4 (210x297mm)' },
  A3: { width: 297, height: 420, label: 'A3 (297x420mm)' },
  A5: { width: 148, height: 210, label: 'A5 (148x210mm)' },
  Letter: { width: 215.9, height: 279.4, label: 'Letter (8.5x11")' },
  Legal: { width: 215.9, height: 355.6, label: 'Legal (8.5x14")' },
  '6x4': { width: 152.4, height: 101.6, label: '4x6 Inch (Standard Print)' },
  '5x7': { width: 177.8, height: 127, label: '5x7 Inch' },
  'Passport': { width: 100, height: 150, label: '4x6 Inch Passport Sheet' },
} as const;

export type PaperSizeKey = keyof typeof PAPER_SIZES;

export const PHOTO_SIZES = [
  { id: '2x2', width: 50.8, height: 50.8, label: '2 x 2 Inch (USA/India)' },
  { id: '35x45', width: 35, height: 45, label: '35 x 45 mm (EU/UK/Standard)' },
  { id: '33x48', width: 33, height: 48, label: '33 x 48 mm (China/Digital)' },
  { id: '30x40', width: 30, height: 40, label: '30 x 40 mm' },
  { id: '51x51', width: 51, height: 51, label: '51 x 51 mm' },
  { id: 'stamp', width: 20, height: 25, label: 'Stamp Size (20x25mm)' },
  { id: 'custom', width: 35, height: 45, label: 'Custom Size' },
] as const;

export const MM_TO_PX = 3.7795275591; // 96 DPI conversion factor
