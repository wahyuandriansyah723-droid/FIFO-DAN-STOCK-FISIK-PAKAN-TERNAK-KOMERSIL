export interface FeedPreset {
  name: string;
  code: string;
  category?: 'pakan' | 'feed_add';
  colorTheme?: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'neutral' | 'orange';
}

export const FEED_PRESETS: FeedPreset[] = [
  // --- PAKAN JADI & UTAMA ---
  { name: 'BEST LAYER L TEPUNG', code: '16021260004100', category: 'pakan', colorTheme: 'neutral' },
  { name: 'SB 10 SUPER MED C – 1 FC', code: '16030103014200', category: 'pakan', colorTheme: 'pink' },
  { name: 'SB 11 SUPER MED AC', code: '16030115014300', category: 'pakan', colorTheme: 'yellow' },
  { name: 'SB 12 SUPER MED C-1 SEMI PLT', code: '16030153014500', category: 'pakan', colorTheme: 'blue' },
  { name: 'BR 0 MED C - 1 FC', code: '16030203013200', category: 'pakan', colorTheme: 'green' },
  { name: 'BR I CRB', code: '16030210013300', category: 'pakan', colorTheme: 'purple' },
  { name: 'GOLD BR I CRB', code: '16030210022300', category: 'pakan', colorTheme: 'yellow' },
  { name: 'GOLD BR I MED C – 1 CRB', code: '16030213022300', category: 'pakan', colorTheme: 'yellow' },
  { name: 'BR II PLT', code: '16030250013600', category: 'pakan', colorTheme: 'blue' },
  { name: 'GOLD BR II MED C – 1 PLT', code: '16030253022600', category: 'pakan', colorTheme: 'yellow' },
  { name: 'K B R', code: '16030810013000', category: 'pakan', colorTheme: 'neutral' },
  { name: 'PAR DOC MED C – 1 FC', code: '16031003013200', category: 'pakan', colorTheme: 'pink' },
  { name: 'SB DOC MED C – 1 FC', code: '16031003014200', category: 'pakan', colorTheme: 'pink' },
  { name: 'PAR S MED C-1 CRB', code: '16031013013300', category: 'pakan', colorTheme: 'green' },
  { name: 'PAR G TEPUNG', code: '16031020013100', category: 'pakan', colorTheme: 'purple' },
  { name: 'PAR G MED C – 1 CRB', code: '16031023013300', category: 'pakan', colorTheme: 'purple' },
  { name: 'S B G MED C – 1 TEPUNG', code: '16031023014100', category: 'pakan', colorTheme: 'yellow' },
  { name: 'PAR L I TEPUNG', code: '16031260013101', category: 'pakan', colorTheme: 'neutral' },
  { name: 'K GR 1', code: '16031620013000', category: 'pakan', colorTheme: 'green' },
  { name: 'KLK SUPER', code: '16032560013000', category: 'pakan', colorTheme: 'blue' },
  { name: 'KLK SUPER 36', code: '16032660086000', category: 'pakan', colorTheme: 'blue' },
  { name: 'ABS CRB', code: '16035610013300', category: 'pakan', colorTheme: 'pink' },
  { name: 'ULU I MED C-1 FC', code: '16035713112200', category: 'pakan', colorTheme: 'green' },
  { name: 'ULU II MED C- 1 CC', code: '16035723112400', category: 'pakan', colorTheme: 'green' },
  { name: 'GOLD EXTRA BR I MED C-1 CRB', code: '16040213035300', category: 'pakan', colorTheme: 'yellow' },
  { name: 'PIALA 241 TEPUNG', code: '16051260050100', category: 'pakan', colorTheme: 'purple' },
  { name: 'PIALA 241 TEPUNG Super RED', code: '16051261050180', category: 'pakan', colorTheme: 'pink' },
  { name: 'GF 511 CRB', code: '16060210068300', category: 'pakan', colorTheme: 'blue' },
  { name: 'M 11 CRB', code: '16060210075300', category: 'pakan', colorTheme: 'neutral' },
  { name: 'M 12 PLT', code: '16060250075600', category: 'pakan', colorTheme: 'neutral' },

  // --- FEED ADD / BAHAN PEMBANTU ---
  { name: 'LYSINE HCL 98.5% (FEED ADD)', code: '180101001100', category: 'feed_add', colorTheme: 'purple' },
  { name: 'DL-METHIONINE 99% (FEED ADD)', code: '180101001200', category: 'feed_add', colorTheme: 'blue' },
  { name: 'L-THREONINE 98.5% (FEED ADD)', code: '180101001300', category: 'feed_add', colorTheme: 'green' },
  { name: 'CHOLINE CHLORIDE 60% (FEED ADD)', code: '180101001400', category: 'feed_add', colorTheme: 'yellow' },
  { name: 'PREMIX LAYER JAPFA (FEED ADD)', code: '180201002100', category: 'feed_add', colorTheme: 'orange' },
  { name: 'PREMIX BROILER JAPFA (FEED ADD)', code: '180201002200', category: 'feed_add', colorTheme: 'pink' },
  { name: 'TOXBIND / MYCOTOXIN BINDER', code: '180301003100', category: 'feed_add', colorTheme: 'neutral' },
  { name: 'DICACIUM PHOSPHATE (DCP 18%)', code: '180401004100', category: 'feed_add', colorTheme: 'blue' },
  { name: 'SODIUM BICARBONATE (GARAM)', code: '180501005100', category: 'feed_add', colorTheme: 'neutral' },
  { name: 'ACIDIFIER POWDER (FEED ADD)', code: '180601006100', category: 'feed_add', colorTheme: 'green' },
];

import { savePresetsToFirestore } from '../lib/firebase';

let cachedPresets: FeedPreset[] = FEED_PRESETS;

export function setCachedPresets(presets: FeedPreset[]): void {
  if (Array.isArray(presets) && presets.length > 0) {
    cachedPresets = presets;
  }
}

export function getMasterPresets(): FeedPreset[] {
  return cachedPresets;
}

export function saveMasterPresets(presets: FeedPreset[]): void {
  cachedPresets = presets;
  savePresetsToFirestore(presets);
}

export function deleteMasterPresetByCode(code: string): FeedPreset[] {
  const current = getMasterPresets();
  const updated = current.filter((p) => p.code !== code);
  saveMasterPresets(updated);
  return updated;
}

export function resetMasterPresets(): FeedPreset[] {
  saveMasterPresets(FEED_PRESETS);
  return FEED_PRESETS;
}
