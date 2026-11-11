import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Layers, Package, ListChecks, Zap } from 'lucide-react';
import { FeedMaterial, KavlingItem } from '../types';
import {
  FeedPreset,
  getMasterPresets,
  deleteMasterPresetByCode,
} from '../data/feedPresets';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { deductFifoFromKavlings, restoreFifoToKavlings, sortKavlingsByFifoDate } from '../utils/fifoUtils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: FeedMaterial | null;
  onSave: (updatedMaterial: FeedMaterial) => void;
  onDelete?: (materialId: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  material,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<FeedMaterial | null>(null);
  const [baseKavlings, setBaseKavlings] = useState<KavlingItem[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [masterPresets, setMasterPresets] = useState<FeedPreset[]>([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<string>('');

  useEffect(() => {
    if (material) {
      const copy: FeedMaterial = JSON.parse(JSON.stringify(material));
      const initialOutbound = (copy.dimuat || 0) + (copy.bocorRepro || 0);
      const reconstructedBase = restoreFifoToKavlings(copy.kavlings, initialOutbound);
      setFormData(copy);
      setBaseKavlings(reconstructedBase);
      setMasterPresets(getMasterPresets());
      setSelectedPresetIndex('');
    }
  }, [material]);

  if (!isOpen || !formData) return null;

  const totalKarungKavling = formData?.kavlings.reduce((sum, k) => sum + (k.quantity || 0), 0) || 0;
  const totalOutbound = (formData?.dimuat || 0) + (formData?.bocorRepro || 0);

  const handleDeleteMasterPreset = () => {
    if (selectedPresetIndex === '') return;
    const idx = parseInt(selectedPresetIndex, 10);
    const preset = masterPresets[idx];
    if (preset && window.confirm(`Hapus "${preset.name}" dari Master List JAPFA?`)) {
      const updated = deleteMasterPresetByCode(preset.code);
      setMasterPresets(updated);
      setSelectedPresetIndex('');
    }
  };

  const handleApplyFifoDeduction = () => {
    if (!formData) return;
    if (totalOutbound <= 0) {
      alert('Isi angka pada kolom "Dimuat" atau "Bocor/Repro" terlebih dahulu.');
      return;
    }
    const updated = deductFifoFromKavlings(baseKavlings, totalOutbound);
    setFormData((prev) => (prev ? { ...prev, kavlings: updated } : null));
  };

  const handleMutationChange = (field: keyof FeedMaterial, val: string) => {
    const num = parseInt(val) || 0;
    setFormData((prev) => {
      if (!prev) return null;
      const newDimuat = field === 'dimuat' ? num : (prev.dimuat || 0);
      const newBocorRepro = field === 'bocorRepro' ? num : (prev.bocorRepro || 0);

      let currentBase = baseKavlings;
      if (field === 'kirimanRetur') {
        const oldRetur = prev.kirimanRetur || 0;
        const diffRetur = num - oldRetur;
        if (diffRetur !== 0) {
          currentBase = restoreFifoToKavlings(baseKavlings, diffRetur);
          setBaseKavlings(currentBase);
        }
      }

      let updatedKavlings = prev.kavlings;
      if (field === 'dimuat' || field === 'bocorRepro' || field === 'kirimanRetur') {
        const newTotalOutbound = newDimuat + newBocorRepro;
        // Otomatis update kavling tanggal terlama (FIFO)
        updatedKavlings = deductFifoFromKavlings(currentBase, newTotalOutbound);
      }

      return {
        ...prev,
        [field]: num,
        kavlings: updatedKavlings,
      };
    });
  };

  const handleKavlingChange = (kavlingId: string, field: keyof KavlingItem, val: any) => {
    setFormData((prev) => {
      if (!prev) return null;

      const index = baseKavlings.findIndex((k) => k.id === kavlingId);
      if (index === -1) return prev;

      const updatedBase = [...baseKavlings];
      const targetBase = { ...updatedBase[index] };
      let diffProduksi = 0;

      if (field === 'quantity') {
        const oldQty = targetBase.quantity || 0;
        const newQty = parseInt(val as string) || 0;
        targetBase.quantity = newQty;
        diffProduksi = targetBase.isBlockFeed ? 0 : newQty - oldQty;
      } else if (field === 'productionDate') {
        const newProdDate = val as string;
        targetBase.productionDate = newProdDate;
        if (newProdDate) {
          const parts = newProdDate.split('-');
          if (parts.length === 3) {
            const yy = parts[0].slice(-2);
            targetBase.batchNumber = `${yy}${parts[1]}${parts[2]}`;
          }
        }
      } else {
        targetBase[field] = val;
      }

      updatedBase[index] = targetBase;
      setBaseKavlings(updatedBase);

      const currentOutbound = (prev.dimuat || 0) + (prev.bocorRepro || 0);
      const updatedKavlings = deductFifoFromKavlings(updatedBase, currentOutbound);

      const newProduksi = Math.max(0, (prev.produksi || 0) + diffProduksi);

      return {
        ...prev,
        kavlings: updatedKavlings,
        produksi: newProduksi,
      };
    });
  };

  const handleAddKavlingRow = (isBlockFeed: boolean = false) => {
    setFormData((prev) => {
      if (!prev) return null;
      const todayStr = new Date().toISOString().split('T')[0];
      const batchStr = todayStr.slice(2).replace(/-/g, ''); // format YYMMDD
      const newKavQty = isBlockFeed ? 200 : 500;
      const newKav: KavlingItem = {
        id: `kav-${Date.now()}`,
        kavCode: isBlockFeed
          ? `BF-B${Math.floor(Math.random() * 800 + 100)}`
          : `A${Math.floor(Math.random() * 800 + 100)}`,
        batchNumber: batchStr,
        quantity: newKavQty,
        productionDate: todayStr,
        isBlockFeed,
      };

      const updatedBase = [...baseKavlings, newKav];
      setBaseKavlings(updatedBase);

      const currentOutbound = (prev.dimuat || 0) + (prev.bocorRepro || 0);
      const updatedKavlings = deductFifoFromKavlings(updatedBase, currentOutbound);

      return {
        ...prev,
        kavlings: updatedKavlings,
        produksi: isBlockFeed ? prev.produksi || 0 : (prev.produksi || 0) + newKavQty, // Standard produksi only auto-increments for standard kavling
      };
    });
  };

  const handleDeleteKavlingRow = (id: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      const targetKav = baseKavlings.find((k) => k.id === id);
      const deletedQty = targetKav ? targetKav.quantity : 0;

      const updatedBase = baseKavlings.filter((k) => k.id !== id);
      setBaseKavlings(updatedBase);

      const currentOutbound = (prev.dimuat || 0) + (prev.bocorRepro || 0);
      const updatedKavlings = deductFifoFromKavlings(updatedBase, currentOutbound);

      return {
        ...prev,
        kavlings: updatedKavlings,
        produksi: Math.max(0, (prev.produksi || 0) - deletedQty),
      };
    });
  };


  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-6 space-y-6 animate-in fade-in zoom-in duration-150 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Edit Data Stock & Kavling Pakan
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {formData.materialName} ({formData.materialCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold border border-rose-200 dark:border-rose-900 cursor-pointer"
                title="Hapus Jenis Pakan Ini dari Laporan"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Hapus Pakan</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* Preset Selector */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <ListChecks className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Ganti / Samakan Dengan Master List Pakan JAPFA ({masterPresets.length} Jenis):</span>
            </label>

            <div className="flex items-center gap-2">
              <select
                value={selectedPresetIndex}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPresetIndex(val);
                  if (val !== '') {
                    const preset = masterPresets[parseInt(val, 10)];
                    if (preset) {
                      setFormData((prev) =>
                        prev
                          ? {
                              ...prev,
                              materialName: preset.name,
                              materialCode: preset.code,
                              colorTheme: preset.colorTheme || prev.colorTheme,
                            }
                          : null
                      );
                    }
                  }
                }}
                className="flex-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="">-- Pilih dari Master Pakan JAPFA ({masterPresets.length} Jenis) --</option>
                {masterPresets.map((preset, idx) => (
                  <option key={preset.code} value={idx}>
                    {preset.name} — ({preset.code})
                  </option>
                ))}
              </select>

              {selectedPresetIndex !== '' && (
                <button
                  type="button"
                  onClick={handleDeleteMasterPreset}
                  className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  title="Hapus jenis barang ini dari Master List JAPFA"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span className="hidden sm:inline">Hapus Master</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Pakan:
              </label>
              <input
                type="text"
                value={formData.materialName}
                onChange={(e) => setFormData((p) => p ? { ...p, materialName: e.target.value } : null)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kode Material:
              </label>
              <input
                type="text"
                value={formData.materialCode}
                onChange={(e) => setFormData((p) => p ? { ...p, materialCode: e.target.value } : null)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Warna Background Laporan:
              </label>
              <select
                value={formData.colorTheme}
                onChange={(e) => setFormData((p) => p ? { ...p, colorTheme: e.target.value as any } : null)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
              >
                <option value="neutral">Netral (Putih/Abu)</option>
                <option value="pink">Pink (Merah Muda)</option>
                <option value="yellow">Kuning (Yellow)</option>
                <option value="blue">Biru Muda (Sky Blue)</option>
                <option value="green">Hijau Muda</option>
                <option value="purple">Ungu</option>
              </select>
            </div>
          </div>

          {/* Section 1: Stock Mutations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Mutasi Stock (Karung)</span>
              </h3>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-lime-100 dark:bg-lime-950/80 px-2.5 py-1 rounded-lg border border-lime-300 dark:border-lime-700">
                Stok Akhir = <span className="font-mono text-lime-800 dark:text-lime-300 font-extrabold">{((formData.stockAwal || 0) + (formData.produksi || 0) + (formData.kirimanRetur || 0) - (formData.dimuat || 0) - (formData.bocorRepro || 0)).toLocaleString('id-ID')}</span> karung
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Stock Awal:
                  </label>
                </div>
                <input
                  type="number"
                  value={formData.stockAwal}
                  onChange={(e) => handleMutationChange('stockAwal', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    + Produksi:
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => (prev ? { ...prev, produksi: totalKarungKavling } : null))}
                    className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    title="Klik untuk menyamakan Masuk Produksi dengan Total Karung Kavling"
                  >
                    = Total Karung ({totalKarungKavling})
                  </button>
                </div>
                <input
                  type="number"
                  value={formData.produksi}
                  onChange={(e) => handleMutationChange('produksi', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  + Kiriman/Retur:
                </label>
                <input
                  type="number"
                  value={formData.kirimanRetur}
                  onChange={(e) => handleMutationChange('kirimanRetur', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">
                  - Dimuat:
                </label>
                <input
                  type="number"
                  value={formData.dimuat}
                  onChange={(e) => handleMutationChange('dimuat', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1">
                  - Bocor/Repro:
                </label>
                <input
                  type="number"
                  value={formData.bocorRepro}
                  onChange={(e) => handleMutationChange('bocorRepro', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-rose-600"
                />
              </div>
            </div>

            {/* FIFO Quick Deduction Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
              <div className="text-[11px] text-amber-900 dark:text-amber-300 leading-snug">
                Total Muat + Bocor: <strong className="font-mono text-rose-700 dark:text-rose-400 font-extrabold">{totalOutbound} Karung</strong>
                <span className="text-slate-500 dark:text-slate-400 ml-1">
                  (Muat: {formData.dimuat || 0}, Bocor: {formData.bocorRepro || 0})
                </span>
              </div>

              <button
                type="button"
                onClick={handleApplyFifoDeduction}
                className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                title="Potong stok kavling tanggal produksi terlama (FIFO) sesuai jumlah Dimuat + Bocor"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-200" />
                <span>Potong Stok Kavling (FIFO Terlama)</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 font-mono">
              * Rumus: Stok Akhir = (Stok Awal + Masuk Produksi + Kiriman Retur) - Dimuat - Bocor
            </p>
          </div>

          {/* Section 2: Kavling Breakdowns */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Rincian Stock Fisik Per Kavling</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddKavlingRow(false)}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Kavling Standar</span>
                </button>

                <span className="text-slate-300 dark:text-slate-700">|</span>

                <button
                  type="button"
                  onClick={() => handleAddKavlingRow(true)}
                  className="flex items-center gap-1 text-xs font-bold text-purple-700 dark:text-purple-300 hover:underline bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-800 cursor-pointer"
                  title="Tambah Kavling Khusus Block Feed yang diisolasi dari Grand Total standar"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>+ Kavling Block Feed</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[240px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                  <tr>
                    <th className="p-2">Kode Kavling</th>
                    <th className="p-2">No. Batch</th>
                    <th className="p-2 text-right">Jumlah (Karung)</th>
                    <th className="p-2 text-center">Tgl Produksi</th>
                    <th className="p-2 text-center">Status Kavling</th>
                    <th className="p-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {sortKavlingsByFifoDate(formData.kavlings).map((kav) => (
                    <tr
                      key={kav.id}
                      className={
                        kav.isBlockFeed
                          ? 'bg-purple-50/80 dark:bg-purple-950/30 hover:bg-purple-100/80 dark:hover:bg-purple-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }
                    >
                      <td className="p-2">
                        <input
                          type="text"
                          value={kav.kavCode}
                          onChange={(e) => handleKavlingChange(kav.id, 'kavCode', e.target.value)}
                          className={`w-full bg-white dark:bg-slate-900 border rounded px-2 py-1 font-bold ${
                            kav.isBlockFeed
                              ? 'text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                              : 'text-blue-600 border-slate-300 dark:border-slate-700'
                          }`}
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          value={kav.batchNumber || ''}
                          onChange={(e) => handleKavlingChange(kav.id, 'batchNumber', e.target.value)}
                          placeholder="No. Batch"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          value={kav.quantity}
                          onChange={(e) => handleKavlingChange(kav.id, 'quantity', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-right font-bold text-slate-900 dark:text-slate-100"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="date"
                          value={kav.productionDate}
                          onChange={(e) => handleKavlingChange(kav.id, 'productionDate', e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 font-sans text-xs"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleKavlingChange(kav.id, 'isBlockFeed', !kav.isBlockFeed)}
                          className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                            kav.isBlockFeed
                              ? 'bg-purple-700 text-white shadow-2xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                          title="Klik untuk mengubah status Block Feed"
                        >
                          {kav.isBlockFeed ? '🔒 BLOCK FEED' : 'Standar'}
                        </button>
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteKavlingRow(kav.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          title="Hapus Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            {onDelete ? (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-900 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Jenis Pakan Ini</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>

        </form>

        {/* Confirm Delete Modal */}
        {onDelete && (
          <ConfirmDeleteModal
            isOpen={isDeleteConfirmOpen}
            title="Hapus Jenis Pakan"
            message={`Apakah Anda yakin ingin menghapus jenis pakan "${formData.materialName}" (${formData.materialCode}) beserta seluruh kavlingnya?`}
            confirmLabel="Ya, Hapus Pakan"
            onConfirm={() => {
              onDelete(formData.id);
              setIsDeleteConfirmOpen(false);
              onClose();
            }}
            onClose={() => setIsDeleteConfirmOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
