import React from 'react';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  RotateCcw,
  PackageCheck,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Sparkles,
  Calendar,
  FileText,
  Copy
} from 'lucide-react';
import { ReportHeaderInfo, FeedMaterial } from '../types';
import {
  calculateStockAkhir,
  calculateTotalPhysicalKavling,
  formatNumber,
  formatDateIndonesian,
  calculateAgeInDays
} from '../utils/fifoUtils';

interface HeaderReportProps {
  headerInfo: ReportHeaderInfo;
  setHeaderInfo: React.Dispatch<React.SetStateAction<ReportHeaderInfo>>;
  materials: FeedMaterial[];
  viewMode: 'table' | 'fifo' | 'analytics';
  setViewMode: (mode: 'table' | 'fifo' | 'analytics') => void;
  onOpenAddFeedModal: () => void;
  onOpenFifoModal: () => void;
  onOpenCopyYesterdayModal: () => void;
  onResetData: () => void;
  onExportExcel: () => void;
  onPrintReport: () => void;
}

export const HeaderReport: React.FC<HeaderReportProps> = ({
  headerInfo,
  setHeaderInfo,
  materials,
  viewMode,
  setViewMode,
  onOpenAddFeedModal,
  onOpenFifoModal,
  onOpenCopyYesterdayModal,
  onResetData,
  onExportExcel,
  onPrintReport,
}) => {
  // Aggregate Metrics
  const totalMaterials = materials.length;
  
  const totalStockAkhirMutasi = materials.reduce(
    (sum, m) => sum + calculateStockAkhir(m),
    0
  );
  
  const totalPhysicalKavling = materials.reduce(
    (sum, m) => sum + calculateTotalPhysicalKavling(m),
    0
  );
  
  const totalKg = totalPhysicalKavling * 50;
  const totalTon = (totalKg / 1000).toFixed(1);
  
  const discrepancyCount = materials.filter(
    (m) => calculateStockAkhir(m) !== calculateTotalPhysicalKavling(m)
  ).length;

  // Aged stock count (>= 7 days)
  let agedKavlingCount = 0;
  materials.forEach((m) => {
    m.kavlings.forEach((k) => {
      const age = calculateAgeInDays(k.productionDate, headerInfo.reportDate);
      if (age >= 7 && k.quantity > 0) agedKavlingCount++;
    });
  });

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-0 z-30">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Report Title */}
          <div className="flex items-center gap-3">
            {/* Custom JAPFA Style Brand Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-1.5 rounded-lg shadow-sm font-bold tracking-wider text-sm">
              <span className="bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-extrabold text-xs">
                J
              </span>
              <span>{headerInfo.companyName}</span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {headerInfo.reportTitle}
                </h1>
                <span className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded font-mono font-bold text-[11px] text-slate-700 dark:text-amber-400">
                  {headerInfo.documentCode || 'PLT - WRH - FM - 02 - 03'} ({headerInfo.documentVersion || 'Ver 1.4'})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {headerInfo.unitLabel} • {headerInfo.companyName}
              </p>
            </div>
          </div>

          {/* Report Date Pickers */}
          <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">Tgl Transaksi:</span>
              <input
                type="date"
                value={headerInfo.transactionDate}
                onChange={(e) =>
                  setHeaderInfo((prev) => ({ ...prev, transactionDate: e.target.value }))
                }
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-medium text-xs focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-slate-400 font-mono">
                ({formatDateIndonesian(headerInfo.transactionDate, 'trans')})
              </span>
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Tgl Laporan:</span>
              <input
                type="date"
                value={headerInfo.reportDate}
                onChange={(e) =>
                  setHeaderInfo((prev) => ({ ...prev, reportDate: e.target.value }))
                }
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-medium text-xs focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-slate-400 font-mono">
                ({formatDateIndonesian(headerInfo.reportDate, 'report')})
              </span>
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

            <button
              onClick={onOpenCopyYesterdayModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Salin Stok Akhir Kemarin ke Hari Ini / Besok"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Stok Kemarin</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Jenis Pakan
              </p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {totalMaterials} <span className="text-xs font-normal text-slate-500">Item</span>
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Stock Fisik
              </p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatNumber(totalPhysicalKavling)} <span className="text-xs font-normal text-slate-500">Krng</span>
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {formatNumber(totalKg)} kg ({totalTon} Ton)
              </p>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            discrepancyCount > 0
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          }`}>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status Rekonsiliasi
              </p>
              <p className={`text-sm font-extrabold flex items-center gap-1 ${
                discrepancyCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {discrepancyCount > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    {discrepancyCount} Item Selisih
                  </>
                ) : (
                  '✓ Mutasi & Fisik Sesuai'
                )}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Mutasi: {formatNumber(totalStockAkhirMutasi)} Karung
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Warning Aging FIFO
              </p>
              <p className={`text-lg font-extrabold ${
                agedKavlingCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {agedKavlingCount} <span className="text-xs font-normal text-slate-500">Kavling (&ge;7 hr)</span>
              </p>
              <p className="text-[10px] text-slate-500">
                Prioritas pengeluaran pertama
              </p>
            </div>
            <div className={`p-2 rounded-lg ${
              agedKavlingCount > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50' : 'bg-slate-200 text-slate-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          
          {/* View Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tabel Laporan (Excel View)</span>
            </button>

            <button
              onClick={() => setViewMode('fifo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'fifo'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulasi FIFO Dispatch</span>
            </button>

            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'analytics'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Analisis & Grafik</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={onOpenAddFeedModal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Jenis Pakan</span>
            </button>

            <button
              onClick={onOpenFifoModal}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold shadow-xs transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Keluar Stock (FIFO)</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors border border-slate-300 dark:border-slate-600"
              title="Download Excel / CSV"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV/Excel</span>
            </button>

            <button
              onClick={onPrintReport}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors border border-slate-300 dark:border-slate-600"
              title="Cetak Laporan"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset ke Data Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
