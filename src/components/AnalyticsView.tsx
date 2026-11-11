import React from 'react';
import {
  PieChart,
  BarChart,
  AlertTriangle,
  Package,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { FeedMaterial, ReportHeaderInfo } from '../types';
import {
  calculateStockAkhir,
  calculateTotalPhysicalKavling,
  calculateAgeInDays,
  formatNumber,
  formatDateIndonesian
} from '../utils/fifoUtils';

interface AnalyticsViewProps {
  materials: FeedMaterial[];
  headerInfo: ReportHeaderInfo;
  onOpenFifoModal: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  materials,
  headerInfo,
  onOpenFifoModal,
}) => {
  // Aggregate Aging Breakdown
  let freshStockCount = 0;   // 0-3 days
  let mediumStockCount = 0;  // 4-6 days
  let agedStockCount = 0;    // >= 7 days

  const agedKavlingList: {
    materialName: string;
    kavCode: string;
    quantity: number;
    prodDate: string;
    ageDays: number;
  }[] = [];

  materials.forEach((m) => {
    m.kavlings.forEach((k) => {
      const age = calculateAgeInDays(k.productionDate, headerInfo.reportDate);
      if (k.quantity > 0) {
        if (age >= 7) {
          agedStockCount += k.quantity;
          agedKavlingList.push({
            materialName: m.materialName,
            kavCode: k.kavCode,
            quantity: k.quantity,
            prodDate: k.productionDate,
            ageDays: age,
          });
        } else if (age >= 4) {
          mediumStockCount += k.quantity;
        } else {
          freshStockCount += k.quantity;
        }
      }
    });
  });

  const totalPhysical = freshStockCount + mediumStockCount + agedStockCount;

  // Sort aged kavlings descending by age
  agedKavlingList.sort((a, b) => b.ageDays - a.ageDays);

  return (
    <div className="space-y-6">
      
      {/* Top Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider mb-2 inline-block">
            Dashboard Analisis FIFO & Stock
          </span>
          <h2 className="text-xl font-black">
            Ringkasan Umur Pakan & Kontrol Kavling Fisik
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Data laporan per tanggal {formatDateIndonesian(headerInfo.reportDate, 'report')}. Pemantauan stok kadaluarsa/lama di gudang.
          </p>
        </div>

        <button
          onClick={onOpenFifoModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Simulasi Outbound Loading</span>
        </button>
      </div>

      {/* Grid 1: Stock Aging Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Fresh Stock Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Stok Segar (&le; 3 Hari)</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatNumber(freshStockCount)} <span className="text-xs font-normal text-slate-500">Karung</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${totalPhysical ? (freshStockCount / totalPhysical) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono text-right">
            {totalPhysical ? ((freshStockCount / totalPhysical) * 100).toFixed(1) : 0}% dari total fisik
          </p>
        </div>

        {/* Mid Stock Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Stok Menengah (4-6 Hari)</span>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-950 text-yellow-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatNumber(mediumStockCount)} <span className="text-xs font-normal text-slate-500">Karung</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-yellow-500 h-full rounded-full"
              style={{ width: `${totalPhysical ? (mediumStockCount / totalPhysical) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono text-right">
            {totalPhysical ? ((mediumStockCount / totalPhysical) * 100).toFixed(1) : 0}% dari total fisik
          </p>
        </div>

        {/* Aged Stock Warning Card */}
        <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">Stok Prioritas FIFO (&ge; 7 Hari)</span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-900 dark:text-rose-200">
            {formatNumber(agedStockCount)} <span className="text-xs font-normal text-rose-600">Karung</span>
          </div>
          <div className="w-full bg-rose-200 dark:bg-rose-900/50 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-rose-600 h-full rounded-full"
              style={{ width: `${totalPhysical ? (agedStockCount / totalPhysical) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-rose-600 mt-1 font-mono text-right font-bold">
            Harus segera dikeluarkan terlebih dahulu!
          </p>
        </div>

      </div>

      {/* Table of Aged Kavlings to Issue */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Daftar Kavling Umur Terlama (&ge; 7 Hari)
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total {agedKavlingList.length} Kavling
          </span>
        </div>

        {agedKavlingList.length > 0 ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-2.5">Jenis Pakan</th>
                  <th className="p-2.5">Kode Kavling</th>
                  <th className="p-2.5 text-center">Tgl Produksi</th>
                  <th className="p-2.5 text-center">Umur (Hari)</th>
                  <th className="p-2.5 text-right">Jumlah Stock (Karung)</th>
                  <th className="p-2.5 text-right">Jumlah (Kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {agedKavlingList.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-slate-100">
                      {row.materialName}
                    </td>
                    <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">
                      {row.kavCode}
                    </td>
                    <td className="p-2.5 text-center text-slate-600 dark:text-slate-300 font-sans">
                      {formatDateIndonesian(row.prodDate, 'short')}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded font-bold bg-amber-300 text-amber-950">
                        {row.ageDays} hari
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatNumber(row.quantity)}
                    </td>
                    <td className="p-2.5 text-right text-slate-500">
                      {formatNumber(row.quantity * 50)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl italic">
            Tidak ada stock kavling dengan umur &ge; 7 hari. Semua stock terpantau segar!
          </div>
        )}
      </div>

      {/* Grid 2: Stock Comparison Bar List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>Distribusi Stock Fisik Per Jenis Pakan</span>
        </h3>

        <div className="space-y-3">
          {materials.map((m) => {
            const physicalQty = calculateTotalPhysicalKavling(m);
            const mutasiQty = calculateStockAkhir(m);
            const percentage = totalPhysical ? (physicalQty / totalPhysical) * 100 : 0;
            const hasDiscrepancy = physicalQty !== mutasiQty;

            return (
              <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-900 dark:text-slate-100 font-sans">
                    {m.materialName} ({m.materialCode})
                  </span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-emerald-600">{formatNumber(physicalQty)} Karung</span>
                    <span className="text-slate-400 font-normal">({(physicalQty * 50 / 1000).toFixed(1)} Ton)</span>
                    {hasDiscrepancy && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                        Selisih Fisik ({physicalQty - mutasiQty})
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
