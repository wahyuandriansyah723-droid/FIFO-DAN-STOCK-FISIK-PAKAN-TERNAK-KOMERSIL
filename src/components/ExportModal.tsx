import React from 'react';
import { X, FileSpreadsheet, FileCode, Printer, Download, CheckCircle2 } from 'lucide-react';
import { FeedMaterial, ReportHeaderInfo } from '../types';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';
import { formatDateIndonesian } from '../utils/fifoUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: FeedMaterial[];
  headerInfo: ReportHeaderInfo;
  onPrintReport: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  materials,
  headerInfo,
  onPrintReport,
}) => {
  if (!isOpen) return null;

  const handleDownloadExcel = async () => {
    await exportToExcel(materials, headerInfo);
    onClose();
  };

  const handleDownloadCSV = () => {
    exportToCSV(materials, headerInfo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Download className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Unduh Laporan FIFO &amp; Stok Fisik
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Pilih format file laporan untuk tanggal {formatDateIndonesian(headerInfo.reportDate, 'short')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Options */}
        <div className="p-6 space-y-4">
          
          {/* Excel Option */}
          <button
            onClick={handleDownloadExcel}
            className="w-full text-left p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all flex items-center gap-4 group cursor-pointer shadow-xs"
          >
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Microsoft Excel (.xlsx)
                </span>
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                  Rekomendasi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Format spreadsheet resmi dengan layout rapi, header PT JAPFA, dan perhitungan otomatis.
              </p>
            </div>
          </button>

          {/* CSV Option */}
          <button
            onClick={handleDownloadCSV}
            className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all flex items-center gap-4 group cursor-pointer"
          >
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md group-hover:scale-105 transition-transform">
              <FileCode className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                Format CSV (.csv)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                File teks terpisah titik-koma (BOM UTF-8) kompatibel dengan semua versi Excel &amp; database.
              </p>
            </div>
          </button>

          {/* Print PDF Option */}
          <button
            onClick={() => {
              onClose();
              onPrintReport();
            }}
            className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-amber-50/50 dark:hover:bg-slate-800 transition-all flex items-center gap-4 group cursor-pointer"
          >
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-md group-hover:scale-105 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                Cetak / Simpan PDF
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Layout cetak resmi siap print kertas A4 / simpan sebagai PDF dari browser.
              </p>
            </div>
          </button>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
