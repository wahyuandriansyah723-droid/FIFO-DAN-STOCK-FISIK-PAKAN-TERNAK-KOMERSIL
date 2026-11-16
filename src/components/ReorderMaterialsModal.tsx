import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  RotateCcw,
  Save,
  Search,
  Check,
  Package,
  Layers,
  ArrowDownAZ,
  ArrowUpAZ,
  Hash,
  Sparkles
} from 'lucide-react';
import { FeedMaterial } from '../types';
import { calculateTotalPhysicalKavling, formatNumber } from '../utils/fifoUtils';

interface ReorderMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: FeedMaterial[];
  onSaveOrder: (reorderedMaterials: FeedMaterial[]) => void;
}

export const ReorderMaterialsModal: React.FC<ReorderMaterialsModalProps> = ({
  isOpen,
  onClose,
  materials,
  onSaveOrder,
}) => {
  const [orderedItems, setOrderedItems] = useState<FeedMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [customRankInput, setCustomRankInput] = useState<{ [id: string]: string }>({});
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (materials && materials.length > 0) {
      setOrderedItems([...materials]);
      const initialRanks: { [id: string]: string } = {};
      materials.forEach((m, idx) => {
        initialRanks[m.id] = String(idx + 1);
      });
      setCustomRankInput(initialRanks);
    }
  }, [materials, isOpen]);

  // Sync ranks when orderedItems changes
  const updateRanks = (newItems: FeedMaterial[]) => {
    setOrderedItems(newItems);
    const ranks: { [id: string]: string } = {};
    newItems.forEach((m, idx) => {
      ranks[m.id] = String(idx + 1);
    });
    setCustomRankInput(ranks);
  };

  // Move 1 position Up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...orderedItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    updateRanks(newItems);
  };

  // Move 1 position Down
  const handleMoveDown = (index: number) => {
    if (index >= orderedItems.length - 1) return;
    const newItems = [...orderedItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    updateRanks(newItems);
  };

  // Jump to Top
  const handleMoveToTop = (index: number) => {
    if (index <= 0) return;
    const newItems = [...orderedItems];
    const [target] = newItems.splice(index, 1);
    newItems.unshift(target);
    updateRanks(newItems);
  };

  // Jump to Bottom
  const handleMoveToBottom = (index: number) => {
    if (index >= orderedItems.length - 1) return;
    const newItems = [...orderedItems];
    const [target] = newItems.splice(index, 1);
    newItems.push(target);
    updateRanks(newItems);
  };

  // Handle direct numeric sequence input change
  const handleRankInputChange = (id: string, val: string) => {
    setCustomRankInput((prev) => ({
      ...prev,
      [id]: val,
    }));
  };

  // Apply custom rank order entered by admin
  const handleApplyCustomRanks = () => {
    const listWithRanks = orderedItems.map((item, originalIdx) => {
      const parsed = parseInt(customRankInput[item.id] || '', 10);
      const rank = isNaN(parsed) ? originalIdx + 1 : parsed;
      return { item, rank, originalIdx };
    });

    listWithRanks.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.originalIdx - b.originalIdx;
    });

    const finalSorted = listWithRanks.map((r) => r.item);
    updateRanks(finalSorted);
  };

  // Quick preset: Sort by Name A-Z
  const handleSortNameAsc = () => {
    const sorted = [...orderedItems].sort((a, b) =>
      a.materialName.localeCompare(b.materialName, 'id', { numeric: true })
    );
    updateRanks(sorted);
  };

  // Quick preset: Sort by Name Z-A
  const handleSortNameDesc = () => {
    const sorted = [...orderedItems].sort((a, b) =>
      b.materialName.localeCompare(a.materialName, 'id', { numeric: true })
    );
    updateRanks(sorted);
  };

  // Quick preset: Sort by Material Code
  const handleSortCodeAsc = () => {
    const sorted = [...orderedItems].sort((a, b) =>
      a.materialCode.localeCompare(b.materialCode, undefined, { numeric: true })
    );
    updateRanks(sorted);
  };

  // Quick preset: Sort by Category (Pakan Utama then Feed Add)
  const handleSortCategory = () => {
    const sorted = [...orderedItems].sort((a, b) => {
      const catA = a.category || 'pakan';
      const catB = b.category || 'pakan';
      if (catA !== catB) {
        return catA === 'pakan' ? -1 : 1;
      }
      return a.materialName.localeCompare(b.materialName);
    });
    updateRanks(sorted);
  };

  // Quick preset: Sort by Stock Karung (High to Low)
  const handleSortStockDesc = () => {
    const sorted = [...orderedItems].sort((a, b) => {
      const stockA = calculateTotalPhysicalKavling(a);
      const stockB = calculateTotalPhysicalKavling(b);
      return stockB - stockA;
    });
    updateRanks(sorted);
  };

  // Reset to original props materials
  const handleReset = () => {
    updateRanks([...materials]);
  };

  // Save changes
  const handleSave = () => {
    onSaveOrder(orderedItems);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 400);
  };

  // Filtered view when searching
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return orderedItems;
    const q = searchQuery.toLowerCase();
    return orderedItems.filter(
      (m) =>
        m.materialName.toLowerCase().includes(q) ||
        m.materialCode.toLowerCase().includes(q)
    );
  }, [orderedItems, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/90 text-white rounded-2xl shadow-sm">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Atur Urutan Bebas Jenis Pakan &amp; Kode Material
                </h2>
                <span className="text-[10px] uppercase font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                  Akses Admin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Urutkan susunan pakan pada tabel stok barang secara bebas sesuai kebutuhan operasional gudang.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Quick Sort Presets */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          
          {/* Search & Custom Rank Apply Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari jenis pakan atau kode material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyCustomRanks}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Terapkan urutan berdasarkan angka nomor urut yang diketik di kolom No"
              >
                <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Terapkan Nomor Urut</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Kembalikan ke urutan awal sebelum diedit"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Preset 1-Click Ordering Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Urutkan Cepat:</span>
            </span>

            <button
              type="button"
              onClick={handleSortNameAsc}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 text-red-600" />
              <span>Nama A → Z</span>
            </button>

            <button
              type="button"
              onClick={handleSortNameDesc}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowUpAZ className="w-3.5 h-3.5 text-red-600" />
              <span>Nama Z → A</span>
            </button>

            <button
              type="button"
              onClick={handleSortCodeAsc}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              <span>Kode Material (0 → 9)</span>
            </button>

            <button
              type="button"
              onClick={handleSortCategory}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Kategori Pakan</span>
            </button>

            <button
              type="button"
              onClick={handleSortStockDesc}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>Stok Terbanyak</span>
            </button>
          </div>
        </div>

        {/* List of Reorderable Feed Materials */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between pb-1">
            <span>Daftar Urutan Pakan Saat Ini ({orderedItems.length} Pakan):</span>
            <span className="text-[10px] text-slate-400 lowercase font-normal">
              Gunakan tombol panah atau ketik angka urutan langsung
            </span>
          </div>

          <div className="space-y-1.5">
            {filteredList.map((item) => {
              // Get actual index in the master orderedItems array
              const actualIndex = orderedItems.findIndex((m) => m.id === item.id);
              const isFirst = actualIndex === 0;
              const isLast = actualIndex === orderedItems.length - 1;
              const isSelected = selectedMaterialId === item.id;
              const totalKarung = calculateTotalPhysicalKavling(item);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMaterialId(item.id)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-red-50/70 dark:bg-red-950/30 border-red-400 dark:border-red-700 shadow-sm'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Left: Sequence Rank & Material Name & Code */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge & Editable Input */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-7 h-7 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black text-xs font-mono flex items-center justify-center tabular-nums shadow-xs">
                        #{actualIndex + 1}
                      </div>

                      <input
                        type="number"
                        min={1}
                        max={orderedItems.length}
                        value={customRankInput[item.id] ?? (actualIndex + 1)}
                        onChange={(e) => handleRankInputChange(item.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyCustomRanks();
                          }
                        }}
                        className="w-12 text-center py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-red-500"
                        title="Ketik angka urutan baru lalu tekan Enter"
                      />
                    </div>

                    {/* Material Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.materialName}
                        </span>
                        {item.category === 'feed_add' ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Feed Add
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Pakan Utama
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-500">
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          {item.materialCode}
                        </span>
                        <span>•</span>
                        <span>{item.kavlings.length} Kavling</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatNumber(totalKarung)} karung
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Reorder Control Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Jump to Top */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveToTop(actualIndex);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isFirst
                          ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 cursor-pointer'
                      }`}
                      title="Pindahkan langsung ke paling atas"
                    >
                      <ChevronsUp className="w-4 h-4" />
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(actualIndex);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isFirst
                          ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
                          : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 cursor-pointer'
                      }`}
                      title="Naikkan 1 baris ke atas"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(actualIndex);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLast
                          ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
                          : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 cursor-pointer'
                      }`}
                      title="Turunkan 1 baris ke bawah"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Jump to Bottom */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveToBottom(actualIndex);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLast
                          ? 'text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 cursor-pointer'
                      }`}
                      title="Pindahkan langsung ke paling bawah"
                    >
                      <ChevronsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Total <strong className="text-slate-900 dark:text-white">{orderedItems.length}</strong> jenis pakan akan disimpan dengan urutan baru ini.
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
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSavedNotice ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Simpan &amp; Terapkan Urutan</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
