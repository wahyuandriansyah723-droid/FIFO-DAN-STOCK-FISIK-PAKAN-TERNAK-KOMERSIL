import React, { useState } from 'react';
import { X, ArrowUpRight, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { FeedMaterial, FifoPickResult } from '../types';
import {
  calculateFifoAllocation,
  formatNumber,
  formatDateIndonesian,
  calculateStockAkhir
} from '../utils/fifoUtils';

interface FifoDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: FeedMaterial[];
  reportDate: string;
  onApplyDispatch: (
    materialId: string,
    dispatchQty: number,
    pickResult: FifoPickResult,
    dispatchType?: 'dimuat' | 'bocorRepro'
  ) => void;
}

export const FifoDispatchModal: React.FC<FifoDispatchModalProps> = ({
  isOpen,
  onClose,
  materials,
  reportDate,
  onApplyDispatch,
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');
  const [requestQty, setRequestQty] = useState<number>(1000);
  const [dispatchType, setDispatchType] = useState<'dimuat' | 'bocorRepro'>('dimuat');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentMaterial = materials.find((m) => m.id === selectedMaterialId) || materials[0];

  const pickResult: FifoPickResult | null = currentMaterial
    ? calculateFifoAllocation(currentMaterial, requestQty, reportDate)
    : null;

  const handleProcess = () => {
    if (!currentMaterial || !pickResult) return;
    onApplyDispatch(currentMaterial.id, requestQty, pickResult, dispatchType);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Simulasi FIFO Outbound Loading
              </h2>
              <p className="text-xs text-slate-500">
                Sistem rekomendasi pengambilan stock berdasarkan umur produksi tertua (FIFO).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Jenis Pakan:
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.materialName} ({m.materialCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jumlah Karung Outbound:
            </label>
            <input
              type="number"
              min={1}
              value={requestQty}
              onChange={(e) => setRequestQty(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kategori Outbound:
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 cursor-pointer">
                <input
                  type="radio"
                  name="dispatchType"
                  value="dimuat"
                  checked={dispatchType === 'dimuat'}
                  onChange={() => setDispatchType('dimuat')}
                  className="accent-amber-600"
                />
                <span>Dimuat</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 cursor-pointer">
                <input
                  type="radio"
                  name="dispatchType"
                  value="bocorRepro"
                  checked={dispatchType === 'bocorRepro'}
                  onChange={() => setDispatchType('bocorRepro')}
                  className="accent-rose-600"
                />
                <span>Bocor</span>
              </label>
            </div>
          </div>
        </div>

        {/* Current Stock Availability Info */}
        {currentMaterial && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Stock Akhir Mutasi saat ini: <strong className="text-slate-900 dark:text-slate-100">{formatNumber(calculateStockAkhir(currentMaterial))} Karung</strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Total Fisik Kavling: <strong className="text-emerald-600 font-bold">{formatNumber(currentMaterial.kavlings.reduce((s, k) => s + Math.max(0, k.quantity), 0))} Karung</strong>
            </span>
          </div>
        )}

        {/* FIFO Recommendation Pick-List Result */}
        {pickResult && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Instruksi Alokasi Kavling (Order FIFO)</span>
            </h3>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Lokasi Kavling</th>
                    <th className="p-2.5">Tgl Prod</th>
                    <th className="p-2.5">Umur (hari)</th>
                    <th className="p-2.5 text-right">Diambil (Karung)</th>
                    <th className="p-2.5 text-right">Sisa Stock Kavling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {pickResult.allocatedKavlings.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">
                        {item.kavCode}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        {formatDateIndonesian(item.productionDate, 'short')}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          item.ageDays >= 7
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {item.ageDays} hari
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatNumber(item.qtyAllocated)}
                      </td>
                      <td className="p-2.5 text-right text-slate-500">
                        {formatNumber(item.remainingInKav)}
                      </td>
                    </tr>
                  ))}

                  {pickResult.allocatedKavlings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        Tidak ada kavling positif yang tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pickResult.unallocatedQty > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Perhatian: Kekurangan stock sebesar <strong>{formatNumber(pickResult.unallocatedQty)} karung</strong> karena kavling fisik tidak mencukupi permintaan.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleProcess}
            disabled={!pickResult || pickResult.allocatedKavlings.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
          >
            {isSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Berhasil Diproses!</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>Eksekusi Outbound Mutasi</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
