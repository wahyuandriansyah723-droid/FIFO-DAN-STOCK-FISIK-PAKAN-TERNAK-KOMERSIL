import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Layers,
  Package,
  Calendar,
  Save,
  Trash2,
  ListChecks,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  Check,
  Tag
} from 'lucide-react';
import { FeedMaterial, KavlingItem } from '../types';
import {
  FeedPreset,
  getMasterPresets,
  addOrUpdateMasterPreset
} from '../data/feedPresets';
import { calculateAgeInDays, formatNumber } from '../utils/fifoUtils';

interface EditKavlingModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  kavling: KavlingItem | null;
  materials: FeedMaterial[];
  onSaveKavling: (
    sourceMaterialId: string,
    updatedKavling: KavlingItem,
    targetMaterialId?: string,
    targetMasterPreset?: FeedPreset
  ) => void;
  onDeleteKavling?: (materialId: string, kavlingId: string) => void;
  reportDate: string;
}

export const EditKavlingModal: React.FC<EditKavlingModalProps> = ({
  isOpen,
  onClose,
  materialId,
  kavling,
  materials,
  onSaveKavling,
  onDeleteKavling,
  reportDate,
}) => {
  // Master Presets state
  const [masterPresets, setMasterPresets] = useState<FeedPreset[]>([]);
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [masterCategoryFilter, setMasterCategoryFilter] = useState<'all' | 'pakan' | 'feed_add'>('all');
  const [isMasterDrawerOpen, setIsMasterDrawerOpen] = useState(false);

  // New Master Preset quick addition
  const [isAddingNewMaster, setIsAddingNewMaster] = useState(false);
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterCode, setNewMasterCode] = useState('');
  const [newMasterCategory, setNewMasterCategory] = useState<'pakan' | 'feed_add'>('pakan');

  // Kavling Form state
  const [selectedTargetMaterialId, setSelectedTargetMaterialId] = useState<string>(materialId);
  const [selectedMasterPreset, setSelectedMasterPreset] = useState<FeedPreset | null>(null);
  const [kavCode, setKavCode] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [productionDate, setProductionDate] = useState<string>('');
  const [isBlockFeed, setIsBlockFeed] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Delete Confirmation state
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    setMasterPresets(getMasterPresets());
  }, [isOpen]);

  useEffect(() => {
    if (kavling) {
      setSelectedTargetMaterialId(materialId);
      setSelectedMasterPreset(null);
      setKavCode(kavling.kavCode || '');
      setBatchNumber(kavling.batchNumber || '');
      setQuantity(kavling.quantity || 0);
      setProductionDate(kavling.productionDate || reportDate);
      setIsBlockFeed(!!kavling.isBlockFeed);
      setNotes(kavling.notes || '');
      setIsConfirmDeleteOpen(false);
      setIsMasterDrawerOpen(false);
      setIsAddingNewMaster(false);
    }
  }, [kavling, materialId, reportDate, isOpen]);

  // Current material reference
  const currentMaterial = useMemo(() => {
    return materials.find((m) => m.id === selectedTargetMaterialId) || materials.find((m) => m.id === materialId);
  }, [materials, selectedTargetMaterialId, materialId]);

  // Calculate FIFO age
  const ageDays = useMemo(() => {
    if (!productionDate) return 0;
    return calculateAgeInDays(productionDate, reportDate);
  }, [productionDate, reportDate]);

  // Filtered Master Presets
  const filteredMasterPresets = useMemo(() => {
    return masterPresets.filter((p) => {
      const matchCat = masterCategoryFilter === 'all' || p.category === masterCategoryFilter;
      const q = masterSearchQuery.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [masterPresets, masterCategoryFilter, masterSearchQuery]);

  // Quick auto-generate batch number from production date
  const handleGenerateBatchFromDate = () => {
    if (!productionDate) return;
    const parts = productionDate.split('-');
    if (parts.length === 3) {
      const yy = parts[0].slice(-2);
      setBatchNumber(`${yy}${parts[1]}${parts[2]}`);
    }
  };

  // Select a preset from Master Data Pakan
  const handleSelectMasterPreset = (preset: FeedPreset) => {
    // Check if there is already a material in the report matching this preset code
    const existingMat = materials.find((m) => m.materialCode === preset.code);
    if (existingMat) {
      setSelectedTargetMaterialId(existingMat.id);
      setSelectedMasterPreset(null);
    } else {
      setSelectedMasterPreset(preset);
    }
    // Update batch number suggestion if empty
    if (!batchNumber && productionDate) {
      const parts = productionDate.split('-');
      if (parts.length === 3) {
        setBatchNumber(`${parts[0].slice(-2)}${parts[1]}${parts[2]}`);
      }
    }
    setIsMasterDrawerOpen(false);
  };

  // Add new Master Preset to JAPFA database
  const handleAddNewMasterPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterName.trim() || !newMasterCode.trim()) return;

    const newPreset: FeedPreset = {
      name: newMasterName.trim().toUpperCase(),
      code: newMasterCode.trim(),
      category: newMasterCategory,
      colorTheme: newMasterCategory === 'feed_add' ? 'purple' : 'blue',
    };

    const updated = addOrUpdateMasterPreset(newPreset);
    setMasterPresets(updated);
    setSelectedMasterPreset(newPreset);
    setNewMasterName('');
    setNewMasterCode('');
    setIsAddingNewMaster(false);
  };

  // Submit Save
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!kavling) return;

    const updated: KavlingItem = {
      ...kavling,
      kavCode: kavCode.trim().toUpperCase() || 'A101',
      batchNumber: batchNumber.trim(),
      quantity: Number(quantity) || 0,
      productionDate: productionDate || reportDate,
      isBlockFeed,
      notes: notes.trim(),
    };

    onSaveKavling(materialId, updated, selectedTargetMaterialId, selectedMasterPreset || undefined);
    onClose();
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (kavling && onDeleteKavling) {
      onDeleteKavling(materialId, kavling.id);
      onClose();
    }
  };

  if (!isOpen || !kavling) return null;

  const tonase = ((quantity * (currentMaterial?.weightPerBagKg || 50)) / 1000).toFixed(2);
  const displayedMaterialName = selectedMasterPreset ? selectedMasterPreset.name : (currentMaterial?.materialName || 'Pakan Tidak Ditemukan');
  const displayedMaterialCode = selectedMasterPreset ? selectedMasterPreset.code : (currentMaterial?.materialCode || '-');
  const displayedCategory = selectedMasterPreset ? selectedMasterPreset.category : currentMaterial?.category;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header Modal (Sticky Top) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-sm shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                Edit Data Kavling Lot &amp; Master Pakan
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                Atur kode kavling fisik, tanggal produksi, nomor batch, dan integrasi master data pakan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Simpan Perubahan Kavling"
            >
              <Save className="w-4 h-4" />
              <span>Simpan</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <form id="edit-kavling-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Section 1: Master Data Pakan Integration Banner */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/80 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Master Data Pakan:
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsMasterDrawerOpen(!isMasterDrawerOpen)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>{isMasterDrawerOpen ? 'Tutup Katalog Master' : 'Buka Katalog Master Data Pakan'}</span>
              </button>
            </div>

            {/* Current Selected Material & Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-800/50">
              <div>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>{displayedMaterialName}</span>
                  {displayedCategory === 'feed_add' ? (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      Feed Add
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Pakan Utama
                    </span>
                  )}
                  {selectedMasterPreset && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Dari Master Data
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Kode Material: <strong className="text-slate-800 dark:text-slate-200 font-bold">{displayedMaterialCode}</strong>
                </div>
              </div>

              {/* Material Dropdown Switcher */}
              <div className="sm:text-right">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Pindahkan Kavling ke Jenis Pakan:
                </label>
                <select
                  value={selectedMasterPreset ? '' : selectedTargetMaterialId}
                  onChange={(e) => {
                    setSelectedTargetMaterialId(e.target.value);
                    setSelectedMasterPreset(null);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer max-w-full"
                >
                  {selectedMasterPreset && (
                    <option value="">{selectedMasterPreset.name} ({selectedMasterPreset.code})</option>
                  )}
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.materialName} ({m.materialCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expandable Master Data Pakan Catalog Drawer */}
            {isMasterDrawerOpen && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-300 dark:border-amber-700/80 p-3.5 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Katalog Master Data Pakan JAPFA ({masterPresets.length} Jenis)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingNewMaster(!isAddingNewMaster)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Jenis Baru ke Master Data</span>
                  </button>
                </div>

                {/* Form to Add New Master Feed */}
                {isAddingNewMaster && (
                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 block">
                      Registrasi Master Pakan Baru ke Database JAPFA:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nama Pakan (e.g. SB 15 SUPER MED)"
                        value={newMasterName}
                        onChange={(e) => setNewMasterName(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold uppercase text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Kode Material (e.g. 16030103014200)"
                        value={newMasterCode}
                        onChange={(e) => setNewMasterCode(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                      <div className="flex items-center gap-1.5">
                        <select
                          value={newMasterCategory}
                          onChange={(e) => setNewMasterCategory(e.target.value as any)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                        >
                          <option value="pakan">Pakan Utama</option>
                          <option value="feed_add">Feed Add</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleAddNewMasterPreset}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter and Search */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari master pakan atau kode..."
                      value={masterSearchQuery}
                      onChange={(e) => setMasterSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMasterCategoryFilter('all')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                        masterCategoryFilter === 'all'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Semua ({masterPresets.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMasterCategoryFilter('pakan')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                        masterCategoryFilter === 'pakan'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Pakan
                    </button>
                    <button
                      type="button"
                      onClick={() => setMasterCategoryFilter('feed_add')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                        masterCategoryFilter === 'feed_add'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Feed Add
                    </button>
                  </div>
                </div>

                {/* Master Presets List Grid */}
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {filteredMasterPresets.map((preset) => {
                    const isMatchedCurrent =
                      currentMaterial?.materialCode === preset.code;

                    return (
                      <div
                        key={preset.code}
                        onClick={() => handleSelectMasterPreset(preset)}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isMatchedCurrent
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs flex items-center gap-1.5 truncate">
                            <span>{preset.name}</span>
                            {preset.category === 'feed_add' && (
                              <span className="text-[8px] bg-purple-200 text-purple-900 px-1 py-0.2 rounded font-black">
                                FEED ADD
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Kode: {preset.code}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          {isMatchedCurrent ? (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <Check className="w-3.5 h-3.5" />
                              <span>Sesuai</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 hover:underline">
                              Gunakan →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Kavling Data Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>Parameter Detail Kavling Lot:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Kode Kavling */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Lokasi Kavling:
                </label>
                <input
                  type="text"
                  required
                  value={kavCode}
                  onChange={(e) => setKavCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A101, B223, BF-101"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-black text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-amber-500"
                />
                
                {/* Quick Bay Chips */}
                <div className="flex items-center gap-1 flex-wrap mt-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">Pilihan Cepat:</span>
                  {['A101', 'A102', 'B201', 'B223', 'C301', 'BF-101'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setKavCode(code)}
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. No. Batch */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nomor Batch:
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateBatchFromDate}
                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Auto YYMMDD
                  </button>
                </div>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. 260721 atau B-260721-01"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Identitas lot batch produksi pakan
                </span>
              </div>

              {/* 3. Jumlah Karung */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Stok Fisik (Karung / Sak):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 tabular-nums pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Karung
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Tonase: <strong className="text-slate-800 dark:text-slate-200">{tonase} Ton</strong> ({formatNumber(quantity * (currentMaterial?.weightPerBagKg || 50))} kg)
                </div>
              </div>

              {/* 4. Tanggal Produksi & FIFO Aging */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Produksi:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={productionDate}
                      onChange={(e) => setProductionDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* FIFO Badge */}
                  <div
                    className={`px-2.5 py-1.5 rounded-xl border font-mono font-bold text-xs shrink-0 flex items-center gap-1 ${
                      ageDays >= 7
                        ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
                        : ageDays >= 4
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ageDays} hari</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 mt-1">
                  {ageDays >= 7 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      ⚠️ Prioritas FIFO Mendesak (Sudah &ge; 7 hari)
                    </span>
                  ) : (
                    <span>Rotasi pengeluaran FIFO terhitung dari tanggal laporan</span>
                  )}
                </div>
              </div>
            </div>

            {/* Status Block Feed Switch */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Status Khusus: BLOCK FEED</span>
                  {isBlockFeed && (
                    <span className="text-[9px] font-black uppercase bg-purple-700 text-white px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kavling berstatus Block Feed diisolasi dari perhitungan Grand Total standar operasional muat.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBlockFeed(!isBlockFeed)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                  isBlockFeed
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                {isBlockFeed ? '🔒 Terkunci (Block Feed)' : 'Standar'}
              </button>
            </div>

            {/* Notes / Keterangan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan / Keterangan Tambahan:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Dekat pintu timur, perlu pallet baru, lot khusus export"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Delete Confirmation Box */}
          {isConfirmDeleteOpen && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-300 dark:border-rose-800 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-extrabold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Konfirmasi Hapus Kavling {kavCode}:</span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Apakah Anda yakin ingin menghapus lot kavling ini dari {currentMaterial?.materialName}? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Ya, Hapus Kavling
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

        </form>

        {/* Sticky Footer Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {onDeleteKavling && !isConfirmDeleteOpen && (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Kavling</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              form="edit-kavling-form"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Kavling</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
