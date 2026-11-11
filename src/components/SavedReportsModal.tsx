import React, { useState } from 'react';
import {
  Calendar,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  ArrowRight,
  Printer,
  Sparkles,
  Search,
  Package
} from 'lucide-react';
import { AllReportsMap } from '../types';
import {
  calculateStockAkhir,
  calculateTotalPhysicalKavling,
  formatDateIndonesian,
  formatNumber
} from '../utils/fifoUtils';

interface SavedReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allReports: AllReportsMap;
  activeDate: string;
  onSelectDate: (dateKey: string) => void;
  onDeleteDate?: (dateKey: string) => void;
  onOpenCopyYesterdayModal?: () => void;
}

export const SavedReportsModal: React.FC<SavedReportsModalProps> = ({
  isOpen,
  onClose,
  allReports,
  activeDate,
  onSelectDate,
  onDeleteDate,
  onOpenCopyYesterdayModal,
}) => {
  const [searchDate, setSearchDate] = useState('');

  if (!isOpen) return null;

  const dates = Object.keys(allReports).sort().reverse(); // newest first
  const filteredDates = dates.filter((d) => {
    const formatted = formatDateIndonesian(d, 'full').toLowerCase();
    return d.includes(searchDate) || formatted.includes(searchDate.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-slate-800 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 px-6 border-b-2 border-red-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg sm:text-xl tracking-tight text-white">
                  Koleksi Laporan Stock Tersimpan
                </h2>
                <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  {dates.length} Tanggal Tersimpan
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Pilih atau kelola riwayat laporan harian pakan ternak yang tersimpan pada database cloud Firestore.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 px-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              placeholder="Cari berdasarkan tanggal (e.g. 2026-07-21, Juli, Senin)..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
            />
          </div>

          {onOpenCopyYesterdayModal && (
            <button
              onClick={() => {
                onClose();
                onOpenCopyYesterdayModal();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Stok Kemarin ke Tanggal Baru</span>
            </button>
          )}
        </div>

        {/* Saved Reports Card Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredDates.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Tidak ada data laporan tersimpan yang sesuai pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDates.map((dateKey) => {
                const report = allReports[dateKey];
                if (!report) return null;
                const isActive = dateKey === activeDate;
                const materials = report.materials || [];
                const totalItem = materials.length;
                const totalKarung = materials.reduce((sum, m) => sum + calculateTotalPhysicalKavling(m), 0);
                const totalKg = totalKarung * 50;
                const totalTon = (totalKg / 1000).toFixed(1);

                // Discrepancy check
                const hasDiscrepancy = materials.some(
                  (m) => calculateStockAkhir(m) !== calculateTotalPhysicalKavling(m)
                );

                return (
                  <div
                    key={dateKey}
                    className={`rounded-2xl p-4.5 border-2 transition-all flex flex-col justify-between ${
                      isActive
                        ? 'border-red-600 bg-red-50/20 dark:bg-red-950/20 shadow-md ring-2 ring-red-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top status */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {dateKey}
                          </span>
                          {isActive && (
                            <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                              SEDANG AKTIF
                            </span>
                          )}
                        </div>

                        {hasDiscrepancy ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                            <AlertCircle className="w-3 h-3" />
                            Ada Selisih
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            100% Sinkron
                          </span>
                        )}
                      </div>

                      {/* Date Title */}
                      <div className="mt-2.5">
                        <div className="font-serif italic font-extrabold text-base text-slate-900 dark:text-amber-400">
                          {formatDateIndonesian(dateKey, 'full')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {report.headerInfo?.companyName || 'PT. Japfa Comfeed Indonesia.Tbk'} • {report.headerInfo?.unitLabel || 'UNIT LPG.'}
                        </div>
                      </div>

                      {/* Mini Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-3.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Item Pakan</div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">{totalItem} Jenis</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fisik Karung</div>
                          <div className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">{formatNumber(totalKarung)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Tonase</div>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{totalTon} Ton</div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Kode: {report.headerInfo?.documentCode || 'PLT-WRH-FM'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {dates.length > 1 && onDeleteDate && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onDeleteDate(dateKey);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Laporan Tanggal Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onSelectDate(dateKey);
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-red-600 text-white hover:bg-red-700 shadow-xs'
                          }`}
                        >
                          <span>{isActive ? 'Buka Laporan Ini' : 'Pilih & Buka'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Data laporan tersimpan secara mandiri per tanggal. Mengubah data tanggal tertentu tidak akan memengaruhi laporan tanggal lain.
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
