import { FeedMaterial, FifoPickResult, KavlingItem } from '../types';

/**
 * Sorts kavling items by production date ascending (oldest/earliest production date first = FIFO priority)
 */
export function sortKavlingsByFifoDate(kavlings: KavlingItem[] = []): KavlingItem[] {
  if (!kavlings) return [];
  return [...kavlings].sort((a, b) => {
    // Put Block Feed kavlings strictly at the bottom
    if (!!a.isBlockFeed !== !!b.isBlockFeed) {
      return a.isBlockFeed ? 1 : -1;
    }
    const timeA = a.productionDate ? new Date(a.productionDate).getTime() : 9999999999999;
    const timeB = b.productionDate ? new Date(b.productionDate).getTime() : 9999999999999;
    return timeA - timeB;
  });
}

/**
 * Calculates stock akhir from mutation fields:
 * Stock Akhir = Stock Awal + Produksi + Kiriman - Dimuat - Bocor
 */
export function calculateStockAkhir(item: FeedMaterial): number {
  return (
    (item.stockAwal || 0) +
    (item.produksi || 0) +
    (item.kirimanRetur || 0) -
    (item.dimuat || 0) -
    (item.bocorRepro || 0)
  );
}

/**
 * Calculates total physical karung stock from sum of standard kavling items (excluding Block Feed by default).
 * When includeBlockFeed is false, Block Feed kavlings are NOT included in the grand total of other kavlings.
 */
export function calculateTotalPhysicalKavling(item: FeedMaterial, includeBlockFeed: boolean = false): number {
  if (!item.kavlings || item.kavlings.length === 0) return 0;
  return item.kavlings.reduce((sum, k) => {
    if (!includeBlockFeed && k.isBlockFeed) return sum;
    return sum + (k.quantity || 0);
  }, 0);
}

/**
 * Calculates total physical karung stock strictly for Block Feed kavlings
 */
export function calculateBlockFeedPhysicalKavling(item: FeedMaterial): number {
  if (!item.kavlings || item.kavlings.length === 0) return 0;
  return item.kavlings.reduce((sum, k) => (k.isBlockFeed ? sum + (k.quantity || 0) : sum), 0);
}

/**
 * Calculates age in days between report date and production date
 */
export function calculateAgeInDays(prodDateStr: string, reportDateStr: string): number {
  if (!prodDateStr || !reportDateStr) return 0;
  const prodDate = new Date(prodDateStr);
  const repDate = new Date(reportDateStr);
  
  if (isNaN(prodDate.getTime()) || isNaN(repDate.getTime())) return 0;
  
  const diffTime = repDate.getTime() - prodDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
  return Math.max(0, diffDays);
}

/**
 * Formats batch number following the production date in format YYMMDD (Year Month Date 2-digits each).
 * e.g. 2026-07-14 -> 260714.
 */
export function formatBatchNumber(batchNumber?: string, productionDate?: string): string {
  if (batchNumber && batchNumber.trim() !== '' && batchNumber !== '-' && !batchNumber.startsWith('B-')) {
    const trimmed = batchNumber.trim();
    if (/^\d{8}$/.test(trimmed)) {
      return trimmed.slice(2); // Convert YYYYMMDD to YYMMDD
    }
    return trimmed;
  }
  if (!productionDate) return batchNumber || '-';
  const parts = productionDate.split('-');
  if (parts.length === 3) {
    const yy = parts[0].slice(-2);
    return `${yy}${parts[1]}${parts[2]}`; // e.g. 260714 (YYMMDD)
  }
  return productionDate.replace(/-/g, '').slice(-6);
}

/**
 * Format numbers with Indonesian thousand separator
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Formats ISO date "YYYY-MM-DD" into Indonesian report format:
 * Style 'trans': "Jul 20, 26"
 * Style 'report': "21. Jul. 2026"
 * Style 'short': "14 Jul"
 */
export function formatDateIndonesian(dateStr: string, style: 'trans' | 'report' | 'short' | 'full' = 'short'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthsIndoFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const dayName = daysIndo[date.getDay()];
  const day = date.getDate();
  const month = monthsIndo[date.getMonth()];
  const monthFull = monthsIndoFull[date.getMonth()];
  const year = date.getFullYear();
  const shortYear = String(year).slice(-2);

  if (style === 'full') {
    return `${dayName}, ${day} ${monthFull} ${year}`;
  } else if (style === 'trans') {
    return `${month} ${day}, ${shortYear}`;
  } else if (style === 'report') {
    return `${day}. ${month}. ${year}`;
  } else {
    return `${day} ${month}`;
  }
}

/**
 * Color styles matching exact spreadsheet styling in image
 */
export function getMaterialThemeStyles(theme: string) {
  switch (theme) {
    case 'pink':
      return {
        bgHeader: 'bg-pink-300 text-pink-950 dark:bg-pink-900 dark:text-pink-100',
        bgSub: 'bg-pink-200 text-pink-900 dark:bg-pink-950 dark:text-pink-200',
        badgeBg: 'bg-pink-400 text-pink-950',
        border: 'border-pink-400',
        accentBar: 'bg-pink-500',
      };
    case 'yellow':
      return {
        bgHeader: 'bg-amber-300 text-amber-950 dark:bg-amber-900 dark:text-amber-100',
        bgSub: 'bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
        badgeBg: 'bg-amber-400 text-amber-950',
        border: 'border-amber-400',
        accentBar: 'bg-amber-500',
      };
    case 'blue':
      return {
        bgHeader: 'bg-sky-200 text-sky-950 dark:bg-sky-900 dark:text-sky-100',
        bgSub: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
        badgeBg: 'bg-sky-300 text-sky-950',
        border: 'border-sky-300',
        accentBar: 'bg-sky-500',
      };
    case 'green':
      return {
        bgHeader: 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100',
        bgSub: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
        badgeBg: 'bg-emerald-300 text-emerald-950',
        border: 'border-emerald-300',
        accentBar: 'bg-emerald-500',
      };
    case 'purple':
      return {
        bgHeader: 'bg-purple-200 text-purple-950 dark:bg-purple-900 dark:text-purple-100',
        bgSub: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200',
        badgeBg: 'bg-purple-300 text-purple-950',
        border: 'border-purple-300',
        accentBar: 'bg-purple-500',
      };
    case 'orange':
      return {
        bgHeader: 'bg-orange-200 text-orange-950 dark:bg-orange-900 dark:text-orange-100',
        bgSub: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200',
        badgeBg: 'bg-orange-300 text-orange-950',
        border: 'border-orange-300',
        accentBar: 'bg-orange-500',
      };
    case 'neutral':
    default:
      return {
        bgHeader: 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
        bgSub: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
        badgeBg: 'bg-slate-300 text-slate-900',
        border: 'border-slate-300',
        accentBar: 'bg-slate-500',
      };
  }
}

/**
 * Calculates FIFO pick allocation (First-In, First-Out)
 * Pulls from oldest production date kavling first
 */
export function calculateFifoAllocation(
  feedItem: FeedMaterial,
  requestedQty: number,
  reportDate: string
): FifoPickResult {
  // Filter out negative/damaged kavlings for normal dispatch allocation or handle them
  const sortedKavlings = [...feedItem.kavlings]
    .filter((k) => k.quantity > 0)
    .sort((a, b) => new Date(a.productionDate).getTime() - new Date(b.productionDate).getTime());

  let remainingToPick = requestedQty;
  const allocations: FifoPickResult['allocatedKavlings'] = [];

  for (const kav of sortedKavlings) {
    if (remainingToPick <= 0) break;

    const pickFromThisKav = Math.min(remainingToPick, kav.quantity);
    const ageDays = calculateAgeInDays(kav.productionDate, reportDate);

    allocations.push({
      kavCode: kav.kavCode,
      productionDate: kav.productionDate,
      ageDays,
      qtyAllocated: pickFromThisKav,
      remainingInKav: kav.quantity - pickFromThisKav,
    });

    remainingToPick -= pickFromThisKav;
  }

  return {
    materialId: feedItem.id,
    materialName: feedItem.materialName,
    requestedQty,
    allocatedKavlings: allocations,
    unallocatedQty: Math.max(0, remainingToPick),
  };
}

/**
 * Automatically deducts total quantity from kavlings based on FIFO (earliest productionDate first).
 * Used when muat (dimuat) or bocor (bocorRepro) occurs.
 * Standard deduction skips Block Feed kavlings so Block Feed stock remains protected.
 */
export function deductFifoFromKavlings(
  kavlings: import('../types').KavlingItem[],
  totalToDeduct: number
): import('../types').KavlingItem[] {
  if (totalToDeduct <= 0 || !kavlings || kavlings.length === 0) {
    return kavlings;
  }

  // Create deep copy of kavlings
  const updated = kavlings.map((k) => ({ ...k }));

  // Sort standard non-block-feed kavling indices by productionDate ascending (earliest date first)
  const sortedIndices = updated
    .map((k, index) => ({
      index,
      isBlockFeed: !!k.isBlockFeed,
      date: new Date(k.productionDate || '9999-12-31').getTime(),
      qty: k.quantity,
    }))
    .filter((k) => !k.isBlockFeed) // Protect block feed kavlings from standard FIFO deduction
    .sort((a, b) => a.date - b.date);

  let remaining = totalToDeduct;

  for (const item of sortedIndices) {
    if (remaining <= 0) break;
    const currentQty = updated[item.index].quantity;
    if (currentQty <= 0) continue; // skip already 0 or negative

    const deductAmount = Math.min(remaining, currentQty);
    updated[item.index].quantity = currentQty - deductAmount;
    remaining -= deductAmount;
  }

  return updated;
}

/**
 * Restores quantity to kavlings in FIFO order (earliest productionDate first)
 * to reconstruct base kavling quantities before outbound deductions.
 */
export function restoreFifoToKavlings(
  kavlings: import('../types').KavlingItem[],
  totalToRestore: number
): import('../types').KavlingItem[] {
  if (totalToRestore <= 0 || !kavlings || kavlings.length === 0) {
    return kavlings;
  }

  const updated = kavlings.map((k) => ({ ...k }));

  // Sort kavling indices by productionDate ascending (earliest date first)
  const sortedIndices = updated
    .map((k, index) => ({
      index,
      date: new Date(k.productionDate || '9999-12-31').getTime(),
    }))
    .sort((a, b) => a.date - b.date);

  if (sortedIndices.length > 0) {
    const earliestIndex = sortedIndices[0].index;
    updated[earliestIndex].quantity += totalToRestore;
  }

  return updated;
}
