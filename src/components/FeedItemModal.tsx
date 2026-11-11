import React, { useState, useEffect } from 'react';
import { X, Plus, PackagePlus, ListChecks, Trash2, Search, RotateCcw, Box, AlertTriangle } from 'lucide-react';
import { FeedMaterial } from '../types';
import {
  FeedPreset,
  getMasterPresets,
  deleteMasterPresetByCode,
  resetMasterPresets,
} from '../data/feedPresets';

interface FeedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFeedMaterial: (newMaterial: FeedMaterial) => void;
  materials?: FeedMaterial[];
  onDeleteMaterial?: (materialId: string) => void;
}

export const FeedItemModal: React.FC<FeedItemModalProps> = ({
  isOpen,
  onClose,
  onAddFeedMaterial,
  materials = [],
  onDeleteMaterial,
}) => {
  const [masterPresets, setMasterPresets] = useState<FeedPreset[]>([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<string>('');
  const [materialName, setMaterialName] = useState('');
  const [materialCode, setMaterialCode] = useState('');
  const [colorTheme, setColorTheme] = useState<FeedMaterial['colorTheme']>('blue');
  const [stockAwal, setStockAwal] = useState(1000);
  const [initialKavCode, setInitialKavCode] = useState('A101');
  const [initialKavQty, setInitialKavQty] = useState(1000);

  // Management UI States
  const [showMasterList, setShowMasterList] = useState(false);
  const [masterSearch, setMasterSearch] = useState('');
  const [deleteConfirmPreset, setDeleteConfirmPreset] = useState<FeedPreset | null>(null);
  const [deleteConfirmReportMaterial, setDeleteConfirmReportMaterial] = useState<FeedMaterial | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMasterPresets(getMasterPresets());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePresetSelect = (idxStr: string) => {
    setSelectedPresetIndex(idxStr);
    if (idxStr === '') return;
    const idx = parseInt(idxStr, 10);
    const preset = masterPresets[idx];
    if (preset) {
      setMaterialName(preset.name);
      setMaterialCode(preset.code);
      if (preset.colorTheme) {
        setColorTheme(preset.colorTheme);
      }
    }
  };

  const handleDeleteSelectedPreset = () => {
    if (selectedPresetIndex === '') return;
    const idx = parseInt(selectedPresetIndex, 10);
    const preset = masterPresets[idx];
    if (preset) {
      setDeleteConfirmPreset(preset);
    }
  };

  const confirmDeletePreset = (presetCode: string) => {
    const updated = deleteMasterPresetByCode(presetCode);
    setMasterPresets(updated);
    setSelectedPresetIndex('');
    setDeleteConfirmPreset(null);
  };

  const handleResetPresets = () => {
    const restored = resetMasterPresets();
    setMasterPresets(restored);
    setSelectedPresetIndex('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim() || !materialCode.trim()) return;

    const newMaterial: FeedMaterial = {
      id: `feed-${Date.now()}`,
      materialName: materialName.toUpperCase(),
      materialCode: materialCode.trim(),
      colorTheme,
      weightPerBagKg: 50,
      stockAwal,
      produksi: initialKavQty,
      kirimanRetur: 0,
      dimuat: 0,
      bocorRepro: 0,
      kavlings: [
        {
          id: `kav-${Date.now()}`,
          kavCode: initialKavCode || 'A101',
          batchNumber: new Date().toISOString().split('T')[0].slice(2).replace(/-/g, ''),
          quantity: initialKavQty,
          productionDate: new Date().toISOString().split('T')[0],
        },
      ],
    };

    onAddFeedMaterial(newMaterial);

    // Reset form
    setSelectedPresetIndex('');
    setMaterialName('');
    setMaterialCode('');
    onClose();
  };

  const filteredPresets = masterPresets.filter(
    (p) =>
      p.name.toLowerCase().includes(masterSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(masterSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-5 sm:p-6 space-y-5 my-auto animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Penerimaan & Tambah Jenis Barang Masuk
              </h2>
              <p className="text-xs text-slate-500">
                Kelola master jenis barang JAPFA dan tambah jenis pakan ke laporan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Selector & Master Delete Icon */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                <ListChecks className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Pilih Dari Master Jenis Barang JAPFA ({masterPresets.length} jenis):</span>
              </label>

              <button
                type="button"
                onClick={() => setShowMasterList(!showMasterList)}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showMasterList ? 'Sembunyikan Master List' : '📋 Kelola Master List JAPFA'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedPresetIndex}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Pilih dari Master List Pakan ({masterPresets.length} Jenis) --</option>
                {masterPresets.map((preset, idx) => (
                  <option key={preset.code} value={idx}>
                    {preset.name} — ({preset.code})
                  </option>
                ))}
              </select>

              {selectedPresetIndex !== '' && (
                <button
                  type="button"
                  onClick={handleDeleteSelectedPreset}
                  className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  title="Hapus jenis barang ini dari Master List JAPFA"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span className="hidden sm:inline">Hapus Master</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 italic">
              Memilih jenis pakan akan otomatis mengisikan Nama Pakan &amp; Kode Material SAP.
            </p>
          </div>

          {/* Master List JAPFA Management Drawer */}
          {showMasterList && (
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Master Pakan JAPFA..."
                    value={masterSearch}
                    onChange={(e) => setMasterSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetPresets}
                  className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer shrink-0"
                  title="Reset Master List kembali ke default 30+ pakan JAPFA"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Master</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.code}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate text-slate-900 dark:text-slate-100">
                        {preset.name}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {preset.code}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmPreset(preset)}
                      className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                      title={`Hapus ${preset.name} dari Master List JAPFA`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {filteredPresets.length === 0 && (
                  <div className="col-span-full text-center py-3 text-slate-400 text-xs italic">
                    Tidak ada jenis pakan ditemukan dalam Master List.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Inputs for Adding Material */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Jenis Pakan:
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: SB 14 FINISHER PLT"
                value={materialName}
                onChange={(e) => {
                  setMaterialName(e.target.value);
                  setSelectedPresetIndex('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kode Material SAP / Pakan:
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 16030160014600"
                value={materialCode}
                onChange={(e) => {
                  setMaterialCode(e.target.value);
                  setSelectedPresetIndex('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Warna Background Laporan:
              </label>
              <select
                value={colorTheme}
                onChange={(e) => setColorTheme(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="pink">Pink / Magenta</option>
                <option value="yellow">Kuning / Amber</option>
                <option value="blue">Biru / Sky Blue</option>
                <option value="green">Hijau / Emerald</option>
                <option value="purple">Ungu / Purple</option>
                <option value="neutral">Abu / Netral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stock Awal Mutasi:
              </label>
              <input
                type="number"
                min={0}
                value={stockAwal}
                onChange={(e) => setStockAwal(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Lokasi Kavling Perdana
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">Kode Kavling:</label>
                <input
                  type="text"
                  value={initialKavCode}
                  onChange={(e) => setInitialKavCode(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block">Jumlah Karung:</label>
                <input
                  type="number"
                  value={initialKavQty}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0;
                    setInitialKavQty(qty);
                    setStockAwal(qty); // Stok Awal = Total Karung
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* REGISTERED BARANG MASUK LIST WITH DELETE ICON */}
          {materials.length > 0 && onDeleteMaterial && (
            <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  <Box className="w-4 h-4 text-amber-600" />
                  <span>Daftar Barang Masuk / Jenis Pakan Terdaftar ({materials.length} item):</span>
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {materials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {mat.materialName}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 flex items-center gap-2">
                        <span>Kode: {mat.materialCode}</span>
                        <span>•</span>
                        <span>Stok Awal: {mat.stockAwal}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmReportMaterial(mat)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      title={`Hapus ${mat.materialName} dari Laporan Barang Masuk`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-[10px]">Hapus</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
              <Plus className="w-4 h-4" />
              <span>Simpan Item Baru</span>
            </button>
          </div>

        </form>

        {/* Modal Confirm Delete Master Preset */}
        {deleteConfirmPreset && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 space-y-4 border border-rose-300 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus dari Master List JAPFA?
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Apakah Anda yakin ingin menghapus <strong>"{deleteConfirmPreset.name}"</strong> ({deleteConfirmPreset.code}) dari Master List JAPFA?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmPreset(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => confirmDeletePreset(deleteConfirmPreset.code)}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
                >
                  Ya, Hapus Master
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirm Delete Report Material */}
        {deleteConfirmReportMaterial && onDeleteMaterial && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 space-y-4 border border-rose-300 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Barang Masuk dari Laporan?
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Apakah Anda yakin ingin menghapus <strong>"{deleteConfirmReportMaterial.materialName}"</strong> ({deleteConfirmReportMaterial.materialCode}) beserta seluruh kavlingnya dari laporan ini?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmReportMaterial(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteMaterial(deleteConfirmReportMaterial.id);
                    setDeleteConfirmReportMaterial(null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
                >
                  Ya, Hapus dari Laporan
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

