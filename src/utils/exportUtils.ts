import ExcelJS from 'exceljs';
import { FeedMaterial, ReportHeaderInfo } from '../types';
import {
  calculateStockAkhir,
  calculateTotalPhysicalKavling,
  formatDateIndonesian,
  formatBatchNumber,
  calculateAgeInDays,
  sortKavlingsByFifoDate,
} from './fifoUtils';

/**
 * Helper to apply fill color to a cell
 */
function setCellFill(cell: ExcelJS.Cell, argbColor: string) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: argbColor },
  };
}

/**
 * Helper to apply thin borders to a cell
 */
function setCellBorder(cell: ExcelJS.Cell, color = 'FFCBD5E1', style: ExcelJS.BorderStyle = 'thin') {
  cell.border = {
    top: { style, color: { argb: color } },
    left: { style, color: { argb: color } },
    bottom: { style, color: { argb: color } },
    right: { style, color: { argb: color } },
  };
}

/**
 * Material color palettes for Excel export matching exact web UI theme styles
 */
function getExcelMaterialTheme(theme?: string, index: number = 0) {
  const palette = [
    { name: 'pink', bgHeader: 'FFF472B6', font: 'FF500724', border: 'FFF472B6' },   // bg-pink-300 / text-pink-950
    { name: 'yellow', bgHeader: 'FFFCD34D', font: 'FF451A03', border: 'FFFBBF24' }, // bg-amber-300 / text-amber-950
    { name: 'blue', bgHeader: 'FFBAE6FD', font: 'FF082F49', border: 'FF38BDF8' },   // bg-sky-200 / text-sky-950
    { name: 'green', bgHeader: 'FFA7F3D0', font: 'FF022C22', border: 'FF34D399' },  // bg-emerald-200 / text-emerald-950
    { name: 'purple', bgHeader: 'FFE9D5FF', font: 'FF3B0764', border: 'FFC084FC' }, // bg-purple-200 / text-purple-950
    { name: 'orange', bgHeader: 'FFFED7AA', font: 'FF431407', border: 'FFFB923C' }, // bg-orange-200 / text-orange-950
    { name: 'neutral', bgHeader: 'FFE2E8F0', font: 'FF0F172A', border: 'FF94A3B8' },// bg-slate-200 / text-slate-900
  ];

  if (theme) {
    const found = palette.find((p) => p.name.toLowerCase() === theme.toLowerCase());
    if (found) return found;
  }

  return palette[index % palette.length];
}

/**
 * Export report data to a beautifully formatted, colorful Excel (.xlsx) file
 * matching the JAPFA Feedmill web report table structure.
 */
export async function exportToExcel(materials: FeedMaterial[], headerInfo: ReportHeaderInfo) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(`FIFO_${headerInfo.reportDate}`);

  // Display grid lines in Excel
  ws.views = [{ showGridLines: true }];

  // Define column widths matching layout
  ws.columns = [
    { key: 'jenisPakan', width: 32 },  // Col A: Jenis Pakan & Kode Material
    { key: 'stAwal', width: 13 },      // Col B: Awal
    { key: 'produksi', width: 13 },    // Col C: Produksi
    { key: 'kiriman', width: 13 },     // Col D: Kiriman/Retur
    { key: 'dimuat', width: 13 },      // Col E: Dimuat
    { key: 'bocor', width: 13 },       // Col F: Bocor/Repro
    { key: 'stAkhir', width: 15 },     // Col G: Akhir (Stock Mutasi)
    { key: 'kavling', width: 14 },     // Col H: KAV
    { key: 'batchNo', width: 18 },     // Col I: No Batch
    { key: 'jumlah', width: 14 },      // Col J: Jumlah (Karung)
    { key: 'tglProd', width: 15 },     // Col K: Tgl Produksi
    { key: 'umurDays', width: 13 },    // Col L: Umur (hari)
    { key: 'totalKarung', width: 15 }, // Col M: Grand Total Karung
    { key: 'totalKg', width: 18 },     // Col N: Grand Total Kg
  ];

  // 1. Header Banner Row 1: Document Title
  ws.mergeCells('A1:N1');
  const titleCell = ws.getCell('A1');
  titleCell.value = (headerInfo.reportTitle || 'TABEL FIFO & STOCK FISIK PAKAN TERNAK').toUpperCase();
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  setCellFill(titleCell, 'FFB91C1C'); // JAPFA Red
  ws.getRow(1).height = 32;

  // 2. Header Subtitle Row 2: Company & Unit Name
  ws.mergeCells('A2:N2');
  const subTitleCell = ws.getCell('A2');
  subTitleCell.value = `${headerInfo.companyName || 'PT JAPFA COMFEED INDONESIA Tbk.'} - ${headerInfo.unitLabel || 'JAPFA FEED'}`;
  subTitleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  setCellFill(subTitleCell, 'FF1E293B'); // Slate 800
  ws.getRow(2).height = 24;

  // 3. Metadata Info Row 3: Transaction & Report Dates & Document Code
  ws.mergeCells('A3:G3');
  const transDateCell = ws.getCell('A3');
  const docCodeStr = headerInfo.documentCode || 'PLT - WRH - FM - 02 - 03';
  const docVerStr = headerInfo.documentVersion || 'Ver 1.4';
  transDateCell.value = `Kode Dokumen: ${docCodeStr} (${docVerStr}) | Tgl Transaksi: ${formatDateIndonesian(headerInfo.transactionDate, 'trans')}`;
  transDateCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  transDateCell.alignment = { horizontal: 'left', vertical: 'middle' };
  setCellFill(transDateCell, 'FFF8FAFC');

  ws.mergeCells('H3:N3');
  const repDateCell = ws.getCell('H3');
  repDateCell.value = `Tanggal Laporan: ${formatDateIndonesian(headerInfo.reportDate, 'report')}`;
  repDateCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  repDateCell.alignment = { horizontal: 'right', vertical: 'middle' };
  setCellFill(repDateCell, 'FFF8FAFC');
  ws.getRow(3).height = 22;

  // Row 4: Spacer
  ws.getRow(4).height = 8;

  // 4. Table Header Row 5: Primary Column Grouping
  ws.getRow(5).height = 26;
  ws.getRow(6).height = 24;

  // Group 1: Jenis Pakan (A5:A6)
  ws.mergeCells('A5:A6');
  const g1 = ws.getCell('A5');
  g1.value = 'JENIS PAKAN &\nKODE MATERIAL';
  g1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  g1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  setCellFill(g1, 'FFBEF264'); // #bef264 Lime 300
  setCellBorder(g1, 'FF64748B');

  // Group 2: MUTASI STOCK (B5:G5)
  ws.mergeCells('B5:G5');
  const g2 = ws.getCell('B5');
  g2.value = 'STOCK';
  g2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  g2.alignment = { horizontal: 'center', vertical: 'middle' };
  setCellFill(g2, 'FFBEF264'); // #bef264 Lime 300
  setCellBorder(g2, 'FF64748B');

  // Group 3: URUTAN PENGELUARAN (FIFO) (H5:L5)
  ws.mergeCells('H5:L5');
  const g3 = ws.getCell('H5');
  g3.value = 'URUTAN PENGELUARAN (FIFO)';
  g3.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF831843' } };
  g3.alignment = { horizontal: 'center', vertical: 'middle' };
  setCellFill(g3, 'FFFBCFE8'); // #fbcfe8 Pink 200
  setCellBorder(g3, 'FF64748B');

  // Group 4: GRAND TOTAL FISIK (M5:N5)
  ws.mergeCells('M5:N5');
  const g4 = ws.getCell('M5');
  g4.value = 'GRAND TOTAL';
  g4.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF831843' } };
  g4.alignment = { horizontal: 'center', vertical: 'middle' };
  setCellFill(g4, 'FFFBCFE8'); // #fbcfe8 Pink 200
  setCellBorder(g4, 'FF64748B');

  // Table Subheaders Row 6
  const subheaders: { col: number; text: string; bg: string; fontColor: string }[] = [
    { col: 2, text: 'AWAL', bg: 'FFD9F99D', fontColor: 'FF0F172A' },       // #d9f99d Lime 200
    { col: 3, text: 'Produksi', bg: 'FFD1FAE5', fontColor: 'FF0F172A' },   // #d1fae5 Emerald 100
    { col: 4, text: 'Kiriman', bg: 'FFD1FAE5', fontColor: 'FF0F172A' },    // #d1fae5 Emerald 100
    { col: 5, text: 'Dimuat', bg: 'FFFEF3C7', fontColor: 'FF0F172A' },     // #fef3c7 Amber 100
    { col: 6, text: 'Bocor', bg: 'FFFEF3C7', fontColor: 'FF0F172A' },      // #fef3c7 Amber 100
    { col: 7, text: 'Akhir', bg: 'FFBEF264', fontColor: 'FF0F172A' },      // #bef264 Lime 300
    { col: 8, text: 'KAV', bg: 'FFFCE7F3', fontColor: 'FF831843' },        // #fce7f3 Pink 100
    { col: 9, text: 'No Batch', bg: 'FFFCE7F3', fontColor: 'FF831843' },   // #fce7f3 Pink 100
    { col: 10, text: 'Jumlah', bg: 'FFFCE7F3', fontColor: 'FF831843' },    // #fce7f3 Pink 100
    { col: 11, text: 'Tgl Produksi', bg: 'FFFCE7F3', fontColor: 'FF831843' }, // #fce7f3 Pink 100
    { col: 12, text: 'Umur (Hari)', bg: 'FFFCE7F3', fontColor: 'FF831843' },  // #fce7f3 Pink 100
    { col: 13, text: 'Karung', bg: 'FFFCE7F3', fontColor: 'FF831843' },   // #fce7f3 Pink 100
    { col: 14, text: 'Kg (50kg)', bg: 'FFFCE7F3', fontColor: 'FF831843' },// #fce7f3 Pink 100
  ];

  subheaders.forEach((sh) => {
    const cell = ws.getRow(6).getCell(sh.col);
    cell.value = sh.text;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: sh.fontColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    setCellFill(cell, sh.bg);
    setCellBorder(cell, 'FF64748B');
  });

  // Also apply borders to merged empty header cells in row 5 & 6
  for (let c = 1; c <= 14; c++) {
    const cell5 = ws.getRow(5).getCell(c);
    const cell6 = ws.getRow(6).getCell(c);
    setCellBorder(cell5, 'FF94A3B8');
    setCellBorder(cell6, 'FF94A3B8');
  }

  // 5. Data Rows population
  let currentRowIdx = 7;

    materials.forEach((m, mIdx) => {
      const stockAkhirMutasi = calculateStockAkhir(m);
      const totalKavlingKarung = calculateTotalPhysicalKavling(m);
      const totalKavlingKg = totalKavlingKarung * (m.weightPerBagKg || 50);
      const sortedKavlings = sortKavlingsByFifoDate(m.kavlings);
      const kavCount = Math.max(1, sortedKavlings.length);
      const startRow = currentRowIdx;
      
      // Get material theme colors for this pakan type
      const mTheme = getExcelMaterialTheme(m.colorTheme, mIdx);

      for (let i = 0; i < kavCount; i++) {
        const row = ws.getRow(currentRowIdx);
        row.height = 22;
        const k = sortedKavlings[i];

        if (i === 0) {
          // Material Name & Code with Theme Background
          const cMat = row.getCell(1);
          cMat.value = `${m.materialName}\n(${m.materialCode})`;
          cMat.font = { name: 'Calibri', size: 9, bold: true, color: { argb: mTheme.font } };
          cMat.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          setCellFill(cMat, mTheme.bgHeader);

          // Stock Mutasi values
          const stockCols = [
            { col: 2, val: m.stockAwal, isInput: false },
            { col: 3, val: m.produksi, isGreen: m.produksi > 0 },
            { col: 4, val: m.kirimanRetur, isGreen: m.kirimanRetur > 0 },
            { col: 5, val: m.dimuat, isAmber: m.dimuat > 0 },
            { col: 6, val: m.bocorRepro, isRose: m.bocorRepro > 0 },
          ];

          stockCols.forEach((sc) => {
            const c = row.getCell(sc.col);
            c.value = sc.val || 0;
            c.numFmt = '#,##0';
            c.alignment = { horizontal: 'right', vertical: 'middle' };

            if (sc.isGreen) {
              setCellFill(c, 'FFD1FAE5'); // Emerald 100
              c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF065F46' } };
            } else if (sc.isAmber) {
              setCellFill(c, 'FFFEF3C7'); // Amber 100
              c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF92400E' } };
            } else if (sc.isRose) {
              setCellFill(c, 'FFFEE2E2'); // Rose 100
              c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF9F1239' } };
            } else {
              setCellFill(c, 'FFFFFFFF');
              c.font = { name: 'Calibri', size: 9, color: { argb: sc.val ? 'FF0F172A' : 'FF94A3B8' } };
            }
          });

          // Stock Akhir (Highlight Lime 200 #d9f99d)
          const cAkhir = row.getCell(7);
          cAkhir.value = stockAkhirMutasi;
          cAkhir.numFmt = '#,##0';
          cAkhir.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
          cAkhir.alignment = { horizontal: 'right', vertical: 'middle' };
          setCellFill(cAkhir, 'FFD9F99D'); // Lime 200 #d9f99d

          // Grand Totals Fisik (Karung & Kg)
          const isDiscrepant = stockAkhirMutasi !== totalKavlingKarung;
          const cKarung = row.getCell(13);
          cKarung.value = totalKavlingKarung;
          cKarung.numFmt = '#,##0';
          cKarung.alignment = { horizontal: 'right', vertical: 'middle' };

          if (isDiscrepant) {
            setCellFill(cKarung, 'FFFEF3C7'); // Soft Amber highlight if selisih
            cKarung.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF92400E' } };
          } else {
            setCellFill(cKarung, 'FFFFFFFF');
            cKarung.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
          }

          const cKg = row.getCell(14);
          cKg.value = totalKavlingKg;
          cKg.numFmt = '#,##0';
          cKg.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
          cKg.alignment = { horizontal: 'right', vertical: 'middle' };
          setCellFill(cKg, 'FFFFFFFF');
        }

        // Kavling Columns
        if (k) {
          const batchStr = formatBatchNumber(k.batchNumber, k.productionDate);
          const ageDays = calculateAgeInDays(k.productionDate, headerInfo.reportDate);
          const tglProdStr = formatDateIndonesian(k.productionDate, 'short');

          // KAV
          const cKav = row.getCell(8);
          cKav.value = k.isBlockFeed ? `${k.kavCode} [BLOCK FEED]` : k.kavCode;
          cKav.alignment = { horizontal: 'center', vertical: 'middle' };
          if (k.isBlockFeed) {
            setCellFill(cKav, 'FFF3E8FF'); // Purple 100 background for block feed kavling
            cKav.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF7E22CE' } };
          } else {
            setCellFill(cKav, 'FFFFFFFF');
            cKav.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
          }

          // Batch No
          const cBatch = row.getCell(9);
          cBatch.value = batchStr;
          cBatch.font = { name: 'Consolas', size: 8.5, color: { argb: 'FF334155' } };
          cBatch.alignment = { horizontal: 'center', vertical: 'middle' };
          setCellFill(cBatch, 'FFFFFFFF');

          // Quantity
          const cQty = row.getCell(10);
          cQty.value = k.quantity;
          cQty.numFmt = '#,##0';
          cQty.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
          cQty.alignment = { horizontal: 'right', vertical: 'middle' };
          setCellFill(cQty, 'FFFFFFFF');

          // Tgl Produksi
          const cTgl = row.getCell(11);
          cTgl.value = tglProdStr;
          cTgl.font = { name: 'Calibri', size: 9, color: { argb: 'FF334155' } };
          cTgl.alignment = { horizontal: 'center', vertical: 'middle' };
          setCellFill(cTgl, 'FFFFFFFF');

          // Umur (Hari) with Aging Highlight
          const cAge = row.getCell(12);
          cAge.value = ageDays;
          cAge.numFmt = '#,##0';
          cAge.alignment = { horizontal: 'center', vertical: 'middle' };

          if (ageDays >= 7) {
            // Priority FIFO / Critical Aging (>= 7 days) -> Soft Red
            setCellFill(cAge, 'FFFEE2E2');
            cAge.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF991B1B' } };
          } else if (ageDays >= 5) {
            // Warning Aging (>= 5 days) -> Soft Amber
            setCellFill(cAge, 'FFFEF3C7');
            cAge.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF92400E' } };
          } else {
            setCellFill(cAge, 'FFFFFFFF');
            cAge.font = { name: 'Calibri', size: 9, color: { argb: 'FF0F172A' } };
          }
        } else {
          // No kavling placeholder
          const cKav = row.getCell(8);
          cKav.value = 'Tanpa Kavling';
          cKav.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
          cKav.alignment = { horizontal: 'center', vertical: 'middle' };
          setCellFill(cKav, 'FFFFFBEB');

          for (let c = 9; c <= 12; c++) {
            const cell = row.getCell(c);
            cell.value = '-';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' } };
            setCellFill(cell, 'FFFFFBEB');
          }
        }

        // Apply cell borders
        const isLastRowInMaterial = i === kavCount - 1;
        for (let c = 1; c <= 14; c++) {
          const cell = row.getCell(c);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: c === 7 || c === 12 ? 'medium' : 'thin', color: { argb: c === 7 || c === 12 ? 'FF334155' : 'FFCBD5E1' } },
            bottom: { style: isLastRowInMaterial ? 'medium' : 'thin', color: { argb: isLastRowInMaterial ? 'FF0F172A' : 'FFCBD5E1' } },
          };
        }

        currentRowIdx++;
      }

    // Merge material columns vertically if multiple kavlings exist
    if (kavCount > 1) {
      const endRow = startRow + kavCount - 1;
      const mergeCols = [1, 2, 3, 4, 5, 6, 7, 13, 14];
      mergeCols.forEach((colIdx) => {
        ws.mergeCells(startRow, colIdx, endRow, colIdx);
      });
    }
  });

  // 6. Grand Total Footer Row
  const totalRow = ws.getRow(currentRowIdx);
  totalRow.height = 26;

  // Calculate grand totals
  const grandStAwal = materials.reduce((s, m) => s + (m.stockAwal || 0), 0);
  const grandProd = materials.reduce((s, m) => s + (m.produksi || 0), 0);
  const grandKiriman = materials.reduce((s, m) => s + (m.kirimanRetur || 0), 0);
  const grandDimuat = materials.reduce((s, m) => s + (m.dimuat || 0), 0);
  const grandBocor = materials.reduce((s, m) => s + (m.bocorRepro || 0), 0);
  const grandStAkhir = materials.reduce((s, m) => s + calculateStockAkhir(m), 0);
  const grandFisikKarung = materials.reduce((s, m) => s + calculateTotalPhysicalKavling(m), 0);
  const grandFisikKg = materials.reduce(
    (s, m) => s + calculateTotalPhysicalKavling(m) * (m.weightPerBagKg || 50),
    0
  );

  // Col A: Title
  const cTotLabel = totalRow.getCell(1);
  cTotLabel.value = 'TOTAL KESELURUHAN';
  cTotLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  cTotLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  setCellFill(cTotLabel, 'FF1E293B');

  // Col B-G: Stock Totals
  const totalVals = [
    { col: 2, val: grandStAwal },
    { col: 3, val: grandProd },
    { col: 4, val: grandKiriman },
    { col: 5, val: grandDimuat },
    { col: 6, val: grandBocor },
    { col: 7, val: grandStAkhir },
  ];

  totalVals.forEach((tv) => {
    const c = totalRow.getCell(tv.col);
    c.value = tv.val;
    c.numFmt = '#,##0';
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { horizontal: 'right', vertical: 'middle' };
    setCellFill(c, 'FF334155');
  });

  // Col H-L: Rekap Fisik Kavling Label
  ws.mergeCells(currentRowIdx, 8, currentRowIdx, 12);
  const cRekap = totalRow.getCell(8);
  cRekap.value = 'REKAP FISIK KAVLING';
  cRekap.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  cRekap.alignment = { horizontal: 'center', vertical: 'middle' };
  setCellFill(cRekap, 'FFD97706'); // Amber 600

  // Col M-N: Total Karung & Kg
  const cTotKarung = totalRow.getCell(13);
  cTotKarung.value = grandFisikKarung;
  cTotKarung.numFmt = '#,##0';
  cTotKarung.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  cTotKarung.alignment = { horizontal: 'right', vertical: 'middle' };
  setCellFill(cTotKarung, 'FF047857');

  const cTotKg = totalRow.getCell(14);
  cTotKg.value = grandFisikKg;
  cTotKg.numFmt = '#,##0';
  cTotKg.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  cTotKg.alignment = { horizontal: 'right', vertical: 'middle' };
  setCellFill(cTotKg, 'FF047857');

  // Borders for total row
  for (let c = 1; c <= 14; c++) {
    const cell = totalRow.getCell(c);
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF64748B' } },
      right: { style: 'thin', color: { argb: 'FF64748B' } },
    };
  }

  // 7. Lembar Pengesahan (Signatures Block)
  currentRowIdx += 2;

  // Section Banner: LEMBAR PENGESAHAN LAPORAN
  ws.mergeCells(currentRowIdx, 1, currentRowIdx, 14);
  const cBanner = ws.getCell(`A${currentRowIdx}`);
  cBanner.value = 'LEMBAR PENGESAHAN LAPORAN';
  cBanner.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  cBanner.alignment = { horizontal: 'center', vertical: 'middle' };
  setCellFill(cBanner, 'FFE2E8F0');
  for (let c = 1; c <= 14; c++) {
    const cell = ws.getRow(currentRowIdx).getCell(c);
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  }

  currentRowIdx += 2;

  // Signee Titles Row
  const sigTitleRowIdx = currentRowIdx;
  ws.mergeCells(sigTitleRowIdx, 2, sigTitleRowIdx, 4);
  ws.mergeCells(sigTitleRowIdx, 6, sigTitleRowIdx, 8);
  ws.mergeCells(sigTitleRowIdx, 11, sigTitleRowIdx, 13);

  const sigRowTitle = ws.getRow(sigTitleRowIdx);
  sigRowTitle.height = 20;

  const title1 = headerInfo.signee1?.title || 'Dibuat oleh';
  const title2 = headerInfo.signee2?.title || 'Diperiksa oleh';
  const title3 = headerInfo.signee3?.title || 'Diketahui Oleh';

  sigRowTitle.getCell(2).value = title1;
  sigRowTitle.getCell(6).value = title2;
  sigRowTitle.getCell(11).value = title3;

  [2, 6, 11].forEach((colIdx) => {
    const cell = sigRowTitle.getCell(colIdx);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Signature Images / Box Area
  const sigBoxStartRowIdx = sigTitleRowIdx + 1;
  const sigBoxEndRowIdx = sigBoxStartRowIdx + 3; // 3 rows height (~60px)

  // Set row heights for signature box
  for (let r = sigBoxStartRowIdx; r < sigBoxEndRowIdx; r++) {
    ws.getRow(r).height = 20;
  }

  ws.mergeCells(sigBoxStartRowIdx, 2, sigBoxEndRowIdx - 1, 4);
  ws.mergeCells(sigBoxStartRowIdx, 6, sigBoxEndRowIdx - 1, 8);
  ws.mergeCells(sigBoxStartRowIdx, 11, sigBoxEndRowIdx - 1, 13);

  // Signee 1 TTD Image or Text
  const boxCell1 = ws.getRow(sigBoxStartRowIdx).getCell(2);
  if (headerInfo.signee1?.signatureImage) {
    addSignatureImageToExcel(
      workbook,
      ws,
      headerInfo.signee1.signatureImage,
      `B${sigBoxStartRowIdx}:D${sigBoxEndRowIdx - 1}`
    );
  } else {
    boxCell1.value = '( Tanda Tangan Digital )';
    boxCell1.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
    boxCell1.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Signee 2 TTD Image or Text
  const boxCell2 = ws.getRow(sigBoxStartRowIdx).getCell(6);
  if (headerInfo.signee2?.signatureImage) {
    addSignatureImageToExcel(
      workbook,
      ws,
      headerInfo.signee2.signatureImage,
      `F${sigBoxStartRowIdx}:H${sigBoxEndRowIdx - 1}`
    );
  } else {
    boxCell2.value = '( Tanda Tangan Digital )';
    boxCell2.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
    boxCell2.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Signee 3 TTD Image or Text
  const boxCell3 = ws.getRow(sigBoxStartRowIdx).getCell(11);
  if (headerInfo.signee3?.signatureImage) {
    addSignatureImageToExcel(
      workbook,
      ws,
      headerInfo.signee3.signatureImage,
      `K${sigBoxStartRowIdx}:M${sigBoxEndRowIdx - 1}`
    );
  } else {
    boxCell3.value = '( Tanda Tangan Digital )';
    boxCell3.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF94A3B8' } };
    boxCell3.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Signee Names Row
  const sigNameRowIdx = sigBoxEndRowIdx;
  ws.mergeCells(sigNameRowIdx, 2, sigNameRowIdx, 4);
  ws.mergeCells(sigNameRowIdx, 6, sigNameRowIdx, 8);
  ws.mergeCells(sigNameRowIdx, 11, sigNameRowIdx, 13);

  const sigNameRow = ws.getRow(sigNameRowIdx);
  sigNameRow.height = 20;

  const name1 = (headerInfo.signee1?.name || 'INDRAWAN').toUpperCase();
  const name2 = (headerInfo.signee2?.name || 'AMIN SODIK').toUpperCase();
  const name3 = (headerInfo.signee3?.name || 'ANTONIUS ANDRI WAROTO').toUpperCase();

  sigNameRow.getCell(2).value = name1;
  sigNameRow.getCell(6).value = name2;
  sigNameRow.getCell(11).value = name3;

  [2, 6, 11].forEach((colIdx) => {
    const cell = sigNameRow.getCell(colIdx);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    // Top border simulating signature line
    cell.border = { top: { style: 'thin', color: { argb: 'FF0F172A' } } };
  });

  // Signee Roles / Positions Row
  const sigRoleRowIdx = sigNameRowIdx + 1;
  ws.mergeCells(sigRoleRowIdx, 2, sigRoleRowIdx, 4);
  ws.mergeCells(sigRoleRowIdx, 6, sigRoleRowIdx, 8);
  ws.mergeCells(sigRoleRowIdx, 11, sigRoleRowIdx, 13);

  const sigRoleRow = ws.getRow(sigRoleRowIdx);
  sigRoleRow.height = 18;

  const role1 = headerInfo.signee1?.role || 'FG Worker Operation';
  const role2 = headerInfo.signee2?.role || 'FG Supervisor';
  const role3 = headerInfo.signee3?.role || 'Head Of WH Subdept';

  sigRoleRow.getCell(2).value = role1;
  sigRoleRow.getCell(6).value = role2;
  sigRoleRow.getCell(11).value = role3;

  [2, 6, 11].forEach((colIdx) => {
    const cell = sigRoleRow.getCell(colIdx);
    cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF475569' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Export to Excel File Blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = `Laporan_FIFO_JAPFA_${headerInfo.reportDate}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
  * Helper to embed signature image in ExcelJS
  */
function addSignatureImageToExcel(
  workbook: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  dataUrl: string,
  rangeStr: string
) {
  try {
    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!match) return;
    const ext = match[1] === 'jpg' ? 'jpeg' : (match[1] as 'png' | 'jpeg');
    const base64Data = match[2];

    const imgId = workbook.addImage({
      base64: base64Data,
      extension: ext,
    });

    ws.addImage(imgId, rangeStr);
  } catch (err) {
    console.error('Failed to embed signature image in Excel:', err);
  }
}

/**
 * Export report data to a clean CSV file (Indonesian Excel regional compatible, semicolon separated, UTF-8 BOM)
 */
export function exportToCSV(materials: FeedMaterial[], headerInfo: ReportHeaderInfo) {
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel character encoding

  // Header metadata
  csvContent += `"${headerInfo.reportTitle || 'TABEL FIFO & STOCK FISIK PAKAN TERNAK'}"\n`;
  csvContent += `"${headerInfo.companyName || 'PT JAPFA COMFEED INDONESIA Tbk.'} - ${headerInfo.unitLabel || 'JAPFA FEED'}"\n`;
  csvContent += `"Tanggal Transaksi: ${formatDateIndonesian(headerInfo.transactionDate, 'trans')}";"";"";"";"";"";"";"Tanggal Laporan: ${formatDateIndonesian(headerInfo.reportDate, 'report')}"\n\n`;

  // Row 1 Table Header (Primary Groups)
  csvContent += `"JENIS PAKAN & KODE MATERIAL";"MUTASI STOCK";"";"";"";"";"";"URUTAN PENGELUARAN (FIFO)";"";"";"";"";"GRAND TOTAL FISIK";""\n`;

  // Row 2 Table Header (Subheaders)
  csvContent += `;"AWAL";"Produksi";"Kiriman";"Dimuat";"Bocor";"Akhir";"KAV";"No Batch";"Jumlah";"Tgl Produksi";"Umur (hari)";"Karung";"Kg"\n`;

  materials.forEach((m, mIdx) => {
    const stockAkhirMutasi = calculateStockAkhir(m);
    const totalKavlingKarung = calculateTotalPhysicalKavling(m);
    const totalKavlingKg = totalKavlingKarung * (m.weightPerBagKg || 50);
    const sortedKavlings = sortKavlingsByFifoDate(m.kavlings);
    const themeLabel = (m.colorTheme || `WARNA-${(mIdx % 8) + 1}`).toUpperCase();
    const matLabelFormatted = `${m.materialName} [${themeLabel}] (${m.materialCode})`;

    if (sortedKavlings.length === 0) {
      csvContent += `"${matLabelFormatted}";${m.stockAwal};${m.produksi};${m.kirimanRetur};${m.dimuat};${m.bocorRepro};${stockAkhirMutasi};"-";"-";0;"-";0;${totalKavlingKarung};${totalKavlingKg}\n`;
    } else {
      sortedKavlings.forEach((k, idx) => {
        const batchStr = formatBatchNumber(k.batchNumber, k.productionDate);
        const ageDays = calculateAgeInDays(k.productionDate, headerInfo.reportDate);
        const tglProdStr = formatDateIndonesian(k.productionDate, 'short');

        const kavCodeFormatted = k.isBlockFeed ? `${k.kavCode} [BLOCK FEED]` : k.kavCode;

        if (idx === 0) {
          csvContent += `"${matLabelFormatted}";${m.stockAwal};${m.produksi};${m.kirimanRetur};${m.dimuat};${m.bocorRepro};${stockAkhirMutasi};"${kavCodeFormatted}";"${batchStr}";${k.quantity};"${tglProdStr}";${ageDays};${totalKavlingKarung};${totalKavlingKg}\n`;
        } else {
          csvContent += `;;;;;;;"${kavCodeFormatted}";"${batchStr}";${k.quantity};"${tglProdStr}";${ageDays};;\n`;
        }
      });
    }
  });

  // Calculate totals
  const grandStAwal = materials.reduce((s, m) => s + (m.stockAwal || 0), 0);
  const grandProd = materials.reduce((s, m) => s + (m.produksi || 0), 0);
  const grandKiriman = materials.reduce((s, m) => s + (m.kirimanRetur || 0), 0);
  const grandDimuat = materials.reduce((s, m) => s + (m.dimuat || 0), 0);
  const grandBocor = materials.reduce((s, m) => s + (m.bocorRepro || 0), 0);
  const grandStAkhir = materials.reduce((s, m) => s + calculateStockAkhir(m), 0);
  const grandFisikKarung = materials.reduce((s, m) => s + calculateTotalPhysicalKavling(m), 0);
  const grandFisikKg = materials.reduce(
    (s, m) => s + calculateTotalPhysicalKavling(m) * (m.weightPerBagKg || 50),
    0
  );

  // Grand total row
  csvContent += `"TOTAL KESELURUHAN";${grandStAwal};${grandProd};${grandKiriman};${grandDimuat};${grandBocor};${grandStAkhir};"REKAP FISIK KAVLING";"";"";"";"";${grandFisikKarung};${grandFisikKg}\n\n`;

  // Lembar Pengesahan in CSV
  const title1 = headerInfo.signee1?.title || 'Dibuat oleh';
  const title2 = headerInfo.signee2?.title || 'Diperiksa oleh';
  const title3 = headerInfo.signee3?.title || 'Diketahui Oleh';

  const name1 = (headerInfo.signee1?.name || 'INDRAWAN').toUpperCase();
  const name2 = (headerInfo.signee2?.name || 'AMIN SODIK').toUpperCase();
  const name3 = (headerInfo.signee3?.name || 'ANTONIUS ANDRI WAROTO').toUpperCase();

  const role1 = headerInfo.signee1?.role || 'FG Worker Operation';
  const role2 = headerInfo.signee2?.role || 'FG Supervisor';
  const role3 = headerInfo.signee3?.role || 'Head Of WH Subdept';

  const ttdStatus1 = headerInfo.signee1?.signatureImage ? '[TTD Digital Terisi]' : '[Tanda Tangan]';
  const ttdStatus2 = headerInfo.signee2?.signatureImage ? '[TTD Digital Terisi]' : '[Tanda Tangan]';
  const ttdStatus3 = headerInfo.signee3?.signatureImage ? '[TTD Digital Terisi]' : '[Tanda Tangan]';

  csvContent += `"LEMBAR PENGESAHAN LAPORAN";"";"";"";"";"";"";"";"";"";"";"";"";""\n`;
  csvContent += `;"${title1}";"";"";;"${title2}";"";"";;;"${title3}";"";"";""\n`;
  csvContent += `;"${ttdStatus1}";"";"";;"${ttdStatus2}";"";"";;;"${ttdStatus3}";"";"";""\n`;
  csvContent += `;"${name1}";"";"";;"${name2}";"";"";;;"${name3}";"";"";""\n`;
  csvContent += `;"${role1}";"";"";;"${role2}";"";"";;;"${role3}";"";"";""\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_FIFO_JAPFA_${headerInfo.reportDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
