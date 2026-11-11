import React, { useState } from 'react';
import { X, Calendar, ArrowRight, Copy, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { FeedMaterial, ReportHeaderInfo } from '../types';
import { calculateStockAkhir, calculateTotalPhysicalKavling, formatNumber, formatDateIndonesian } from '../utils/fifoUtils';

interface CopyYesterdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  headerInfo: ReportHeaderInfo;
  materials: FeedMaterial[];
  onConfirmCopy: (newReportDate: string, newTransactionDate: string) => void;
}

export const CopyYesterdayModal: React.FC<CopyYesterdayModalProps> = ({
  isOpen,
  onClose,
  headerInfo,
  materials,
  onConfirmCopy,
}) => {
  if (!isOpen) return null;

  // Calculate default next date (current reportDate + 1 day)
  const getNextDayString = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const currentDate = headerInfo.reportDate;
  const [targetDate, setTargetDate] = useState<string>(getNextDayString(currentDate));
  const [targetTransDate, setTargetTransDate] = useState<string>(getNextDayString(currentDate));
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // Calculate total closing stock from yesterday
  const totalClosingStock = materials.reduce((sum, m) => sum + calculateStockAkhir(m), 0);
  const totalPhysicalKavling = materials.reduce((sum, m) => sum + calculateTotalPhysicalKavling(m), 0);

  const handleExecuteCopy = () => {
    onConfirmCopy(targetDate, targetTransDate);
    setIsConfirming(false);
    onClose();
  };

  const handleClose = () => {
    setIsConfirming(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Copy className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Salin Stok Kemarin ke Laporan Baru
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Fitur otomatis carry-over stok akhir ke stok awal tanggal berikutnya
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

        {/* Content Body */}
        {isConfirming ? (
          <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 text-xs">
            {/* Warning Question Box */}
            <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-400">
                    KONFIRMASI TINDAKAN PENTING
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Apakah Anda Yakin Ingin Menyalin Stok Kemarin?
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Sistem akan menyalin seluruh saldo stok akhir dari laporan tanggal{' '}
                <strong className="text-slate-900 dark:text-white font-bold underline">
                  {formatDateIndonesian(currentDate, 'full')}
                </strong>{' '}
                menjadi stok awal untuk tanggal laporan baru:{' '}
                <strong className="text-emerald-700 dark:text-emerald-400 font-bold underline">
                  {formatDateIndonesian(targetDate, 'full')}
                </strong>.
              </p>
            </div>

            {/* Confirmation Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Rincian Salinan yang Akan Dibuat:
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">TOTAL STOK DITRANSFER</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {formatNumber(totalClosingStock)}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">Karung (@50kg)</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">JUMLAH MATERIAL PAKAN</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums">
                    {materials.length}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">Jenis Pakan</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Aturan Pembuatan Laporan Baru:</span>
                </div>
                <div className="pl-5 text-[11px] space-y-0.5 text-blue-800 dark:text-blue-300">
                  <div>• Kolom Produksi, Kiriman, Dimuat, &amp; Bocor disetel 0 untuk input baru.</div>
                  <div>• Seluruh nomor kavling dan umur batch produksi yang masih ada stok tetap dipertahankan.</div>
                  <div>• Laporan tanggal asal tidak akan hilang dan tetap tersimpan di arsip.</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 text-xs">
            {/* Transition Visual Step */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              {/* Yesterday Box */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Laporan Kemarin
                </span>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {formatDateIndonesian(currentDate, 'short')}
                </div>
                <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div>Stok Akhir Mutasi: <b className="text-emerald-600 dark:text-emerald-400">{formatNumber(totalClosingStock)}</b> Karung</div>
                  <div>Total Kavling Fisik: <b className="text-blue-600 dark:text-blue-400">{formatNumber(totalPhysicalKavling)}</b> Karung</div>
                </div>
              </div>

              {/* Transition Arrow */}
              <div className="flex flex-col items-center justify-center gap-1 text-blue-600 dark:text-blue-400 py-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Salin Stok (Carry Over)
                </span>
              </div>

              {/* Target New Day Box */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800/60 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block mb-1">
                  Laporan Baru (Hari Ini / Esok)
                </span>
                <div className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                  {formatDateIndonesian(targetDate, 'short')}
                </div>
                <div className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-0.5">
                  <div>Stok Awal Baru: <b>{formatNumber(totalClosingStock)}</b> Karung</div>
                  <div>Mutasi (Produksi/Muat): <b>0</b> (Reset Fresh)</div>
                </div>
              </div>
            </div>

            {/* Date Picker Section */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Tentukan Tanggal Laporan Baru
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tanggal Laporan Baru
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => {
                      setTargetDate(e.target.value);
                      setTargetTransDate(e.target.value);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tanggal Transaksi Baru
                  </label>
                  <input
                    type="date"
                    value={targetTransDate}
                    onChange={(e) => setTargetTransDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Explanations */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-2xl space-y-2">
              <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Yang Akan Terjadi Saat Salin Stok:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                <li>
                  <strong>Stock Awal</strong> setiap pakan diisi persis sama dengan <strong>Stock Akhir Mutasi</strong> hari kemarin.
                </li>
                <li>
                  Kolom mutasi harian (<strong>Produksi, Kiriman/Retur, Dimuat, Bocor/Repro</strong>) di-reset ke <strong>0</strong> untuk input transaksi baru.
                </li>
                <li>
                  <strong>Kavling fisik</strong> yang masih memiliki saldo karung (&gt; 0) akan tetap dipertahankan lengkap dengan tanggal produksi &amp; nomor batch-nya.
                </li>
                <li>
                  Anda dapat membatalkan tindakan ini kapan saja dengan menekan tombol <strong>Undo (Ctrl+Z)</strong>.
                </li>
              </ul>
            </div>

            {/* Item Preview Table */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider block">
                Ringkasan Saldo Per Pakan yang Ditransfer ({materials.length} Item):
              </span>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">Jenis Pakan</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-right">Stock Akhir Kemarin</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-right">Stock Awal Baru</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-center">Kavling Aktif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {materials.map((m) => {
                      const stAkhir = calculateStockAkhir(m);
                      const activeKav = m.kavlings.filter((k) => k.quantity > 0).length;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 font-sans font-bold text-slate-900 dark:text-slate-100">{m.materialName}</td>
                          <td className="p-2 text-right text-slate-600 dark:text-slate-400">{formatNumber(stAkhir)}</td>
                          <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(stAkhir)}</td>
                          <td className="p-2 text-center text-slate-500">{activeKav} Lot</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          {isConfirming ? (
            <>
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              >
                ← Batal / Periksa Kembali
              </button>

              <button
                type="button"
                onClick={handleExecuteCopy}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer text-xs active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Saya Yakin Salin Stok Sekarang!</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer text-xs active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Lanjut Salin Stok ke {formatDateIndonesian(targetDate, 'short')}</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
