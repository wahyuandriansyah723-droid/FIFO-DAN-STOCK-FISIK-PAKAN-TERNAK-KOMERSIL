import React, { useState } from 'react';
import {
  Edit3,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Search,
  Filter,
  Copy,
  Calendar,
  Printer,
  Download,
  FileSpreadsheet,
  FileCode,
  PenTool,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Table as TableIcon,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  Archive,
  Truck
} from 'lucide-react';
import { FeedMaterial, ReportHeaderInfo, KavlingItem, AllReportsMap, UserAccount } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { EditHeaderModal } from './EditHeaderModal';
import { SignatureModal } from './SignatureModal';
import { SavedReportsModal } from './SavedReportsModal';
import {
  calculateStockAkhir,
  calculateTotalPhysicalKavling,
  calculateBlockFeedPhysicalKavling,
  calculateAgeInDays,
  formatNumber,
  formatDateIndonesian,
  formatBatchNumber,
  getMaterialThemeStyles,
  sortKavlingsByFifoDate
} from '../utils/fifoUtils';

interface ReportTableViewProps {
  materials: FeedMaterial[];
  headerInfo: ReportHeaderInfo;
  setHeaderInfo?: React.Dispatch<React.SetStateAction<ReportHeaderInfo>>;
  onEditMaterial: (material: FeedMaterial) => void;
  onDeleteMaterial: (materialId: string) => void;
  onQuickAddKavling: (materialId: string, isBlockFeed?: boolean) => void;
  onEditKavling: (materialId: string, kavling: KavlingItem) => void;
  onDeleteKavling: (materialId: string, kavlingId: string) => void;
  onOpenCopyYesterdayModal?: () => void;
  availableDates?: string[];
  onSelectDate?: (dateStr: string) => void;
  onDeleteDateReport?: (dateStr: string) => void;
  onPrintReport?: () => void;
  onExportExcel?: () => void;
  currentUser?: UserAccount | null;
  onOpenMasterUsersModal?: () => void;
  onOpenLoginModal?: () => void;
  allReports?: AllReportsMap;
  onGoToLoadingBoard?: () => void;
}

export const ReportTableView: React.FC<ReportTableViewProps> = ({
  materials,
  headerInfo,
  setHeaderInfo,
  onEditMaterial,
  onDeleteMaterial,
  onQuickAddKavling,
  onEditKavling,
  onDeleteKavling,
  onOpenCopyYesterdayModal,
  availableDates = [],
  onSelectDate,
  onDeleteDateReport,
  onPrintReport,
  onExportExcel,
  currentUser,
  onOpenMasterUsersModal,
  onOpenLoginModal,
  allReports = {},
  onGoToLoadingBoard,
}) => {
  // View Modes: 'classic' (Buku Besar Multi-Row JAPFA), 'simple' (Tabel Ringkas), 'cards' (Kartu Visual)
  const [displayMode, setDisplayMode] = useState<'classic' | 'simple' | 'cards'>('classic');
  const [expandedMaterialIds, setExpandedMaterialIds] = useState<Record<string, boolean>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'pakan' | 'feed_add'>('all');
  const [filterAgeLimit, setFilterAgeLimit] = useState<number>(0); // 0 = all, 5 = >=5, 7 = >=7

  // Modals
  const [isEditHeaderModalOpen, setIsEditHeaderModalOpen] = useState(false);
  const [isSavedReportsModalOpen, setIsSavedReportsModalOpen] = useState(false);
  const [deleteTargetMaterial, setDeleteTargetMaterial] = useState<FeedMaterial | null>(null);
  const [deleteTargetKavling, setDeleteTargetKavling] = useState<{
    materialId: string;
    kavlingId: string;
    kavCode: string;
  } | null>(null);

  // Signatures
  const [isEditingSignees, setIsEditingSignees] = useState(false);
  const [activeSignatureKey, setActiveSignatureKey] = useState<'signee1' | 'signee2' | 'signee3' | null>(null);
  const [signeesDraft, setSigneesDraft] = useState({
    signee1: headerInfo.signee1 || { title: 'Dibuat oleh', name: 'INDRAWAN', role: 'FG Worker Operation' },
    signee2: headerInfo.signee2 || { title: 'Diperiksa oleh', name: 'AMIN SODIK', role: 'FG Supervisor' },
    signee3: headerInfo.signee3 || { title: 'Diketahui Oleh', name: 'ANTONIUS ANDRI WAROTO', role: 'Head Of WH Subdept' },
  });

  const toggleExpand = (materialId: string) => {
    setExpandedMaterialIds((prev) => ({
      ...prev,
      [materialId]: !prev[materialId],
    }));
  };

  const handleStartEditSignees = () => {
    setSigneesDraft({
      signee1: headerInfo.signee1 || { title: 'Dibuat oleh', name: 'INDRAWAN', role: 'FG Worker Operation' },
      signee2: headerInfo.signee2 || { title: 'Diperiksa oleh', name: 'AMIN SODIK', role: 'FG Supervisor' },
      signee3: headerInfo.signee3 || { title: 'Diketahui Oleh', name: 'ANTONIUS ANDRI WAROTO', role: 'Head Of WH Subdept' },
    });
    setIsEditingSignees(true);
  };

  const handleSaveSignees = () => {
    if (setHeaderInfo) {
      setHeaderInfo((prev) => ({
        ...prev,
        signee1: signeesDraft.signee1,
        signee2: signeesDraft.signee2,
        signee3: signeesDraft.signee3,
      }));
    }
    setIsEditingSignees(false);
  };

  const handleSaveSignature = (key: 'signee1' | 'signee2' | 'signee3', signatureDataUrl: string) => {
    if (setHeaderInfo) {
      setHeaderInfo((prev) => {
        const currentSignee = prev[key] || {
          title: key === 'signee1' ? 'Dibuat oleh' : key === 'signee2' ? 'Diperiksa oleh' : 'Diketahui Oleh',
          name: key === 'signee1' ? 'INDRAWAN' : key === 'signee2' ? 'AMIN SODIK' : 'ANTONIUS ANDRI WAROTO',
          role: key === 'signee1' ? 'FG Worker Operation' : key === 'signee2' ? 'FG Supervisor' : 'Head Of WH Subdept',
        };
        return {
          ...prev,
          [key]: {
            ...currentSignee,
            signatureImage: signatureDataUrl,
          },
        };
      });
    }
  };

  // Filtered Materials
  const filteredMaterials = materials.filter((item) => {
    const matchesSearch =
      item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materialCode.includes(searchTerm) ||
      item.kavlings.some((k) => k.kavCode.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }

    if (filterAgeLimit > 0) {
      const hasAgedStock = item.kavlings.some(
        (k) => calculateAgeInDays(k.productionDate, headerInfo.reportDate) >= filterAgeLimit
      );
      if (!hasAgedStock) return false;
    }

    return true;
  });

  // Calculate Overall Report Totals
  const totalStockAwal = filteredMaterials.reduce((sum, m) => sum + (m.stockAwal || 0), 0);
  const totalProduksi = filteredMaterials.reduce((sum, m) => sum + (m.produksi || 0), 0);
  const totalKiriman = filteredMaterials.reduce((sum, m) => sum + (m.kirimanRetur || 0), 0);
  const totalDimuat = filteredMaterials.reduce((sum, m) => sum + (m.dimuat || 0), 0);
  const totalBocor = filteredMaterials.reduce((sum, m) => sum + (m.bocorRepro || 0), 0);
  const totalStockAkhir = filteredMaterials.reduce((sum, m) => sum + calculateStockAkhir(m), 0);
  const totalKarungFisik = filteredMaterials.reduce((sum, m) => sum + calculateTotalPhysicalKavling(m), 0);
  const totalKgFisik = filteredMaterials.reduce(
    (sum, m) => sum + calculateTotalPhysicalKavling(m) * (m.weightPerBagKg || 50),
    0
  );
  const totalTonFisik = (totalKgFisik / 1000).toFixed(1);

  const totalDiscrepancies = filteredMaterials.filter(
    (m) => calculateStockAkhir(m) !== calculateTotalPhysicalKavling(m)
  ).length;

  let agedKavlingCount = 0;
  filteredMaterials.forEach((m) => {
    m.kavlings.forEach((k) => {
      const age = calculateAgeInDays(k.productionDate, headerInfo.reportDate);
      if (age >= 7 && k.quantity > 0) agedKavlingCount++;
    });
  });

  return (
    <div className="space-y-4">

      {/* User Session Status Banner (Print Hidden) */}
      {currentUser && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 px-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
              {currentUser.fullName ? currentUser.fullName.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {currentUser.fullName}
                </span>
                {currentUser.role === 'admin' ? (
                  <span className="bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Kepala Gudang (Admin)
                  </span>
                ) : currentUser.role === 'operator' ? (
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Operator Gudang
                  </span>
                ) : currentUser.role === 'supervisor' ? (
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Supervisor (Checker)
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Tamu / Viewer (Lihat Saja)
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                @{currentUser.username} • {currentUser.department || 'Gudang Finished Goods'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' && onOpenMasterUsersModal && (
              <button
                type="button"
                onClick={onOpenMasterUsersModal}
                className="bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Kelola Master Data Username & Email"
              >
                <span>Master Data Username & Email</span>
                <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded font-mono">
                  Admin
                </span>
              </button>
            )}

            {onOpenLoginModal && (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-1.5 px-2.5 rounded-xl transition-colors cursor-pointer"
                title="Ganti Akun Pengguna"
              >
                Ganti Akun
              </button>
            )}
          </div>
        </div>
      )}

      {/* Official JAPFA Document Header (Format Resmi Laporan Stok Fisik & FIFO) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 print:p-0 print:border-none print:shadow-none">
        {/* Top Brand Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          {/* Logo & Report Title */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-1.5 rounded-xl shadow-xs font-bold tracking-wider text-sm">
              <span className="bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-extrabold text-xs">
                J
              </span>
              <span>{headerInfo.companyName || 'PT JAPFA COMFEED INDONESIA Tbk.'}</span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                  {headerInfo.reportTitle || 'TABEL FIFO & STOCK FISIK PAKAN TERNAK'}
                </h1>
                <span className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded font-mono font-bold text-[11px] text-slate-700 dark:text-amber-400">
                  {headerInfo.documentCode || 'PLT - WRH - FM - 02 - 03'} ({headerInfo.documentVersion || 'Ver 1.4'})
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditHeaderModalOpen(true)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 print:hidden cursor-pointer"
                  title="Edit Judul & Kode Dokumen"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {headerInfo.unitLabel || 'JAPFA FEED'} • Unit Pakan Ternak (Satuan Dalam Karung @50kg)
              </p>
            </div>
          </div>

          {/* Action Buttons & Quick Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs print:hidden">
            <button
              type="button"
              onClick={() => setIsSavedReportsModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Buka Koleksi Laporan Tersimpan"
            >
              <Archive className="w-3.5 h-3.5 text-amber-400" />
              <span>Arsip Laporan ({availableDates.length})</span>
            </button>

            {onOpenCopyYesterdayModal && (
              <button
                type="button"
                onClick={onOpenCopyYesterdayModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Salin stok akhir hari ini menjadi stok awal tanggal baru"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Stok Kemarin</span>
              </button>
            )}

            {onPrintReport && (
              <button
                type="button"
                onClick={onPrintReport}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
                title="Cetak Laporan / PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak / PDF</span>
              </button>
            )}

            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Download file Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            )}

            {onGoToLoadingBoard && (
              <button
                type="button"
                onClick={onGoToLoadingBoard}
                className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Buka Dasbor Urutan Muat FIFO & Panduan Forklift"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-200" />
                <span>Urutan Muat FIFO</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Pickers & Saved Dates Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Tgl Transaksi:</span>
              <input
                type="date"
                value={headerInfo.transactionDate}
                onChange={(e) => {
                  if (setHeaderInfo) setHeaderInfo((prev) => ({ ...prev, transactionDate: e.target.value }));
                }}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 font-medium text-xs font-mono"
              />
              <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                ({formatDateIndonesian(headerInfo.transactionDate, 'trans')})
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">Tgl Laporan:</span>
              <input
                type="date"
                value={headerInfo.reportDate}
                onChange={(e) => {
                  if (onSelectDate) onSelectDate(e.target.value);
                  else if (setHeaderInfo) setHeaderInfo((prev) => ({ ...prev, reportDate: e.target.value }));
                }}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 font-mono font-bold text-xs text-red-600"
              />
              <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                ({formatDateIndonesian(headerInfo.reportDate, 'report')})
              </span>
            </div>
          </div>

          {/* Quick Date Archive Pills */}
          {availableDates.length > 1 && onSelectDate && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 print:hidden">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Pilih Arsip:
              </span>
              {availableDates.map((d) => {
                const isActive = d === headerInfo.reportDate;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onSelectDate(d)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {formatDateIndonesian(d, 'short')}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4 Summary Metric Cards (Gaya Resmi Klasik JAPFA) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden pt-1">
          {/* Total Jenis Pakan */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Jenis Pakan
              </p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {filteredMaterials.length} <span className="text-xs font-normal text-slate-500">Item</span>
              </p>
              <p className="text-[10px] text-slate-500">
                {materials.filter((m) => m.category === 'pakan').length} Pakan • {materials.filter((m) => m.category === 'feed_add').length} Feed Add
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Total Stock Fisik */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Stock Fisik
              </p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatNumber(totalKarungFisik)} <span className="text-xs font-normal text-slate-500">Krng</span>
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {formatNumber(totalKgFisik)} kg ({totalTonFisik} Ton)
              </p>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Status Rekonsiliasi */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              totalDiscrepancies > 0
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status Rekonsiliasi
              </p>
              <p
                className={`text-sm font-extrabold flex items-center gap-1 ${
                  totalDiscrepancies > 0
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {totalDiscrepancies > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{totalDiscrepancies} Item Selisih</span>
                  </>
                ) : (
                  <span>✓ Mutasi &amp; Fisik Sesuai</span>
                )}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Mutasi: {formatNumber(totalStockAkhir)} Karung
              </p>
            </div>
          </div>

          {/* Warning Aging FIFO */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Warning Aging FIFO
              </p>
              <p
                className={`text-lg font-extrabold tabular-nums ${
                  agedKavlingCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {agedKavlingCount}{' '}
                <span className="text-xs font-normal text-slate-500">Kavling (&ge;7 hr)</span>
              </p>
              <p className="text-[10px] text-slate-500">Prioritas pengeluaran pertama</p>
            </div>
            <div
              className={`p-2 rounded-lg ${
                agedKavlingCount > 0
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, and View Mode Toggles */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden shadow-2xs">
        
        {/* Search Input */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari jenis pakan, kode material, atau nomor kavling..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Semua Pakan ({materials.length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('pakan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'pakan'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Pakan Utama
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('feed_add')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'feed_add'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Feed Add
          </button>

          <select
            value={filterAgeLimit}
            onChange={(e) => setFilterAgeLimit(Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
          >
            <option value={0}>Semua Umur</option>
            <option value={5}>Aging &ge; 5 Hari</option>
            <option value={7}>Aging &ge; 7 Hari (FIFO)</option>
          </select>
        </div>

        {/* View Mode Segmented Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDisplayMode('classic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              displayMode === 'classic'
                ? 'bg-white dark:bg-slate-900 text-red-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Tampilan Format Asli Buku Besar FIFO JAPFA"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Format Asli (Buku Besar)</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('simple')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              displayMode === 'simple'
                ? 'bg-white dark:bg-slate-900 text-red-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Tampilan Tabel Ringkas"
          >
            <List className="w-3.5 h-3.5" />
            <span>Tabel Ringkas</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              displayMode === 'cards'
                ? 'bg-white dark:bg-slate-900 text-red-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Tampilan Kartu Visual Interaktif"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kartu Visual</span>
          </button>
        </div>

      </div>

      {/* --- MODE 1: TAMPILAN TABEL RINGKAS (SIMPLE & MODERN) --- */}
      {displayMode === 'simple' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Jenis Pakan &amp; Kode</th>
                  <th className="py-3 px-3 text-right">Stok Awal</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Masuk (+)</th>
                  <th className="py-3 px-3 text-right text-rose-400">Keluar (-)</th>
                  <th className="py-3 px-3 text-right">Stok Akhir</th>
                  <th className="py-3 px-3 text-right">Fisik (Kg)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4">Kavling Lot</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredMaterials.map((mat) => {
                  const stockAkhir = calculateStockAkhir(mat);
                  const totalKarung = calculateTotalPhysicalKavling(mat);
                  const totalKg = totalKarung * (mat.weightPerBagKg || 50);
                  const isBalance = stockAkhir === totalKarung;
                  const isExpanded = !!expandedMaterialIds[mat.id];
                  const sortedKav = sortKavlingsByFifoDate(mat.kavlings);
                  const oldestKav = sortedKav[0];
                  const oldestAge = oldestKav
                    ? calculateAgeInDays(oldestKav.productionDate, headerInfo.reportDate)
                    : 0;

                  return (
                    <React.Fragment key={mat.id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Name & Code */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {mat.materialName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] font-bold text-slate-500">
                              {mat.materialCode}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              • {mat.weightPerBagKg || 50}kg/sak
                            </span>
                          </div>
                        </td>

                        {/* Stok Awal */}
                        <td className="py-3.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                          {formatNumber(mat.stockAwal)}
                        </td>

                        {/* Masuk */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {mat.produksi + mat.kirimanRetur > 0 ? `+${formatNumber(mat.produksi + mat.kirimanRetur)}` : '-'}
                        </td>

                        {/* Keluar */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400">
                          {mat.dimuat + mat.bocorRepro > 0 ? `-${formatNumber(mat.dimuat + mat.bocorRepro)}` : '-'}
                        </td>

                        {/* Stok Akhir */}
                        <td className="py-3.5 px-3 text-right font-mono font-black text-sm tabular-nums bg-lime-50/60 dark:bg-lime-950/20 text-slate-900 dark:text-lime-300">
                          {formatNumber(stockAkhir)}
                        </td>

                        {/* Fisik Kg */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-slate-800 dark:text-slate-200">
                          <div>{formatNumber(totalKarung)} sak</div>
                          <div className="text-[10px] text-slate-400">{(totalKg / 1000).toFixed(1)} Ton</div>
                        </td>

                        {/* Status Balance */}
                        <td className="py-3.5 px-3 text-center">
                          {isBalance ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sinkron</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Selisih ({totalKarung - stockAkhir})</span>
                            </span>
                          )}
                        </td>

                        {/* Kavling Summary & Expand */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => toggleExpand(mat.id)}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                          >
                            <span>{mat.kavlings.length} Kavling</span>
                            {oldestAge > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${oldestAge >= 7 ? 'bg-rose-500 text-white' : oldestAge >= 4 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                FIFO: {oldestAge} hari
                              </span>
                            )}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditMaterial(mat)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Edit Mutasi / Transaksi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onQuickAddKavling(mat.id, false)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Tambah Kavling Baru"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetMaterial(mat)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Hapus Jenis Pakan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Kavling Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 dark:bg-slate-950/40 border-b-2 border-slate-200 dark:border-slate-800">
                          <td colSpan={9} className="p-4 px-6">
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <span>Detail Kavling Lot untuk {mat.materialName}</span>
                                <button
                                  type="button"
                                  onClick={() => onQuickAddKavling(mat.id, false)}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Tambah Kavling</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                {sortedKav.map((kav) => {
                                  const age = calculateAgeInDays(kav.productionDate, headerInfo.reportDate);
                                  return (
                                    <div
                                      key={kav.id}
                                      className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                                    >
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                                            {kav.kavCode}
                                          </span>
                                          {kav.isBlockFeed && (
                                            <span className="bg-purple-700 text-white text-[8px] font-black px-1.5 py-0.2 rounded">
                                              BLOCK FEED
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                          Tgl: {kav.productionDate} • {age} hari
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-amber-400">
                                          {formatNumber(kav.quantity)} sak
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => onEditKavling(mat.id, kav)}
                                          className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                                          title="Edit Kavling"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODE 2: TAMPILAN KARTU VISUAL (MENARIK & INTERAKTIF) --- */}
      {displayMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => {
            const stockAkhir = calculateStockAkhir(mat);
            const totalKarung = calculateTotalPhysicalKavling(mat);
            const totalKg = totalKarung * (mat.weightPerBagKg || 50);
            const isBalance = stockAkhir === totalKarung;
            const sortedKav = sortKavlingsByFifoDate(mat.kavlings);
            const oldestKav = sortedKav[0];
            const oldestAge = oldestKav ? calculateAgeInDays(oldestKav.productionDate, headerInfo.reportDate) : 0;

            return (
              <div
                key={mat.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                        {mat.materialName}
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-500 mt-0.5">
                        {mat.materialCode}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isBalance ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          Sinkron
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                          Selisih
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-center">
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Awal</div>
                      <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {formatNumber(mat.stockAwal)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Masuk/Keluar</div>
                      <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        +{mat.produksi} / -{mat.dimuat}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-lime-700 dark:text-lime-400 uppercase">Akhir</div>
                      <div className="text-xs font-mono font-black text-lime-700 dark:text-lime-400 mt-0.5">
                        {formatNumber(stockAkhir)}
                      </div>
                    </div>
                  </div>

                  {/* Kavling Tags */}
                  <div className="mt-3 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Kavling Lot ({sortedKav.length}):</span>
                      {oldestAge > 0 && (
                        <span className="text-rose-600 font-bold">Tertua: {oldestAge} hari</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sortedKav.slice(0, 4).map((k) => (
                        <span
                          key={k.id}
                          className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200"
                        >
                          {k.kavCode}: {k.quantity}
                        </span>
                      ))}
                      {sortedKav.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-mono py-1">
                          +{sortedKav.length - 4} lagi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 mt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-slate-900 dark:text-white font-mono">
                    {formatNumber(totalKarung)} sak ({((totalKg)/1000).toFixed(1)} T)
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onQuickAddKavling(mat.id, false)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      + Kavling
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditMaterial(mat)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                    >
                      Edit Mutasi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODE 3: TAMPILAN BUKU BESAR KLASIK JAPFA (MULTI-ROW KAVLING SPREADSHEET) --- */}
      {displayMode === 'classic' && (
        <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
          <table className="w-full border-collapse text-xs select-none">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-700 font-bold text-center uppercase tracking-wider text-[11px]">
                <th rowSpan={2} className="bg-[#bef264] text-slate-900 border-r border-slate-300 p-2 min-w-[200px]">
                  Jenis Pakan &amp; Kode Material
                </th>
                <th colSpan={6} className="bg-[#bef264] text-slate-900 border-r border-slate-300 p-2">
                  STOCK MUTASI
                </th>
                <th colSpan={6} className="bg-[#fbcfe8] text-pink-950 border-r border-slate-300 p-2">
                  URUTAN PENGELUARAN FIFO (KAVLING)
                </th>
                <th colSpan={2} className="bg-[#fbcfe8] text-pink-950 p-2">
                  GRAND TOTAL
                </th>
              </tr>
              <tr className="border-b-2 border-slate-400 dark:border-slate-700 font-bold text-center text-[10px] uppercase">
                <th className="bg-[#d9f99d] text-slate-900 border-r border-slate-300 px-2 py-1.5 w-[70px]">AWAL</th>
                <th className="bg-[#d1fae5] text-slate-900 border-r border-slate-300 px-2 py-1.5 w-[65px]">Produksi</th>
                <th className="bg-[#d1fae5] text-slate-900 border-r border-slate-300 px-2 py-1.5 w-[65px]">Kiriman/Retur</th>
                <th className="bg-[#fef3c7] text-slate-900 border-r border-slate-300 px-2 py-1.5 w-[65px]">Dimuat</th>
                <th className="bg-[#fef3c7] text-slate-900 border-r border-slate-300 px-2 py-1.5 w-[65px]">Bocor/Repro</th>
                <th className="bg-[#bef264] text-slate-900 border-r-2 border-blue-600 px-2 py-1.5 w-[80px]">AKHIR</th>
                
                <th className="bg-[#fce7f3] text-pink-950 border-r-2 border-blue-600 px-2 py-1.5 w-[90px]">KAV</th>
                <th className="bg-[#fce7f3] text-pink-950 border-r-2 border-blue-600 px-2 py-1.5 w-[90px]">No Batch</th>
                <th className="bg-[#fce7f3] text-pink-950 border-r-2 border-blue-600 px-2 py-1.5 w-[80px]">Jumlah</th>
                <th className="bg-[#fce7f3] text-pink-950 border-r-2 border-blue-600 px-2 py-1.5 w-[75px]">Tgl Prod</th>
                <th className="bg-[#fce7f3] text-pink-950 border-r-2 border-blue-600 px-2 py-1.5 w-[70px]">Umur</th>
                <th className="bg-[#fce7f3] text-pink-950 border-r-2 border-blue-600 px-1.5 py-1.5 w-[65px] text-center">Aksi</th>

                <th className="bg-[#fce7f3] text-pink-950 border-r border-slate-300 px-2 py-1.5 w-[85px]">Karung</th>
                <th className="bg-[#fce7f3] text-pink-950 px-2 py-1.5 w-[100px]">Kg (50kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-blue-600 dark:divide-blue-500 font-mono">
              {filteredMaterials.map((mat) => {
                const stockAkhir = calculateStockAkhir(mat);
                const totalKarung = calculateTotalPhysicalKavling(mat);
                const totalKg = totalKarung * (mat.weightPerBagKg || 50);
                const sortedKav = sortKavlingsByFifoDate(mat.kavlings);
                const kavCount = Math.max(1, sortedKav.length);

                return (
                  <React.Fragment key={mat.id}>
                    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td rowSpan={kavCount} className="p-3 align-middle border-r border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 border-b-4 border-slate-900">
                        <div className="font-bold text-sm uppercase text-slate-900 dark:text-white">{mat.materialName}</div>
                        <div className="text-xs font-mono text-slate-500">{mat.materialCode}</div>
                        <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 print:hidden flex-wrap">
                          <button type="button" onClick={() => onEditMaterial(mat)} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded text-[11px] font-bold cursor-pointer">Edit</button>
                          <button type="button" onClick={() => onQuickAddKavling(mat.id, false)} className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded text-[11px] font-bold cursor-pointer">+Kav</button>
                          <button type="button" onClick={() => onQuickAddKavling(mat.id, true)} className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 rounded text-[11px] font-bold cursor-pointer">+Block</button>
                          <button type="button" onClick={() => setDeleteTargetMaterial(mat)} className="p-1 hover:bg-rose-100 text-rose-600 rounded text-[11px] cursor-pointer" title="Hapus Jenis Pakan">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td rowSpan={kavCount} className="text-right px-2 py-2 border-r border-slate-300 font-semibold border-b-4 border-slate-900">{formatNumber(mat.stockAwal)}</td>
                      <td rowSpan={kavCount} className="text-right px-2 py-2 border-r border-slate-300 font-semibold border-b-4 border-slate-900 text-emerald-600">{mat.produksi > 0 ? formatNumber(mat.produksi) : ''}</td>
                      <td rowSpan={kavCount} className="text-right px-2 py-2 border-r border-slate-300 font-semibold border-b-4 border-slate-900 text-emerald-600">{mat.kirimanRetur > 0 ? formatNumber(mat.kirimanRetur) : ''}</td>
                      <td rowSpan={kavCount} className="text-right px-2 py-2 border-r border-slate-300 font-semibold border-b-4 border-slate-900 text-amber-600">{mat.dimuat > 0 ? formatNumber(mat.dimuat) : ''}</td>
                      <td rowSpan={kavCount} className="text-right px-2 py-2 border-r border-slate-300 font-semibold border-b-4 border-slate-900 text-rose-600">{mat.bocorRepro > 0 ? formatNumber(mat.bocorRepro) : ''}</td>
                      <td rowSpan={kavCount} className="text-right px-2.5 py-2 border-r-2 border-blue-600 font-black text-sm bg-[#d9f99d] text-slate-900 border-b-4 border-slate-900">{formatNumber(stockAkhir)}</td>
                      
                      {/* First Kavling */}
                      {sortedKav.length > 0 ? (
                        <KavlingCells
                          kavling={sortedKav[0]}
                          materialId={mat.id}
                          reportDate={headerInfo.reportDate}
                          onEditKavling={onEditKavling}
                          onRequestDeleteKavling={(mId, kId, kCode) => setDeleteTargetKavling({ materialId: mId, kavlingId: kId, kavCode: kCode })}
                          isLastInMaterial={sortedKav.length <= 1}
                        />
                      ) : (
                        <td colSpan={6} className="text-center py-2 text-slate-400 italic bg-amber-50 border-b-4 border-slate-900">Belum ada kavling</td>
                      )}

                      <td rowSpan={kavCount} className="text-right px-2 py-2 border-r border-slate-300 font-bold border-b-4 border-slate-900">{formatNumber(totalKarung)}</td>
                      <td rowSpan={kavCount} className="text-right px-2 py-2 font-bold border-b-4 border-slate-900">{formatNumber(totalKg)}</td>
                    </tr>

                    {/* Additional Kavlings */}
                    {sortedKav.slice(1).map((kav, idx) => (
                      <tr key={kav.id} className="hover:bg-slate-50/80 transition-colors">
                        <KavlingCells
                          kavling={kav}
                          materialId={mat.id}
                          reportDate={headerInfo.reportDate}
                          onEditKavling={onEditKavling}
                          onRequestDeleteKavling={(mId, kId, kCode) => setDeleteTargetKavling({ materialId: mId, kavlingId: kId, kavCode: kCode })}
                          isLastInMaterial={idx === sortedKav.length - 2}
                        />
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-black text-xs uppercase border-t-2 border-slate-900">
                <td className="p-3 text-center border-r border-slate-700">TOTAL KESELURUHAN</td>
                <td className="text-right p-2 border-r border-slate-700 font-mono">{formatNumber(totalStockAwal)}</td>
                <td className="text-right p-2 border-r border-slate-700 font-mono text-emerald-300">{totalProduksi > 0 ? formatNumber(totalProduksi) : ''}</td>
                <td className="text-right p-2 border-r border-slate-700 font-mono text-emerald-300">{totalKiriman > 0 ? formatNumber(totalKiriman) : ''}</td>
                <td className="text-right p-2 border-r border-slate-700 font-mono text-amber-300">{totalDimuat > 0 ? formatNumber(totalDimuat) : ''}</td>
                <td className="text-right p-2 border-r border-slate-700 font-mono text-rose-300">{totalBocor > 0 ? formatNumber(totalBocor) : ''}</td>
                <td className="text-right p-2 border-r-2 border-slate-600 font-mono text-lime-300 text-sm">{formatNumber(totalStockAkhir)}</td>
                <td colSpan={6} className="text-center p-2 border-r border-slate-700 text-slate-300 text-[10px]">REKAP FISIK KAVLING</td>
                <td className="text-right p-2 border-r border-slate-700 font-mono text-amber-300 text-sm">{formatNumber(totalKarungFisik)}</td>
                <td className="text-right p-2 font-mono text-white text-sm">{formatNumber(totalKgFisik)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Signatures / Approval Block (Lembar Pengesahan) */}
      <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Lembar Pengesahan Laporan Stock
            </span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
              3 Penandatangan
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isEditingSignees ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditingSignees(false)}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignees}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-extrabold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Penandatangan</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEditSignees}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Nama &amp; Tanda Tangan</span>
              </button>
            )}
          </div>
        </div>

        {isEditingSignees ? (
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Signee 1 */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl space-y-2">
              <label className="block font-bold">Kolom 1: Status</label>
              <input
                type="text"
                value={signeesDraft.signee1.title}
                onChange={(e) => setSigneesDraft({ ...signeesDraft, signee1: { ...signeesDraft.signee1, title: e.target.value } })}
                className="w-full p-1.5 border rounded"
              />
              <label className="block font-bold">Nama</label>
              <input
                type="text"
                value={signeesDraft.signee1.name}
                onChange={(e) => setSigneesDraft({ ...signeesDraft, signee1: { ...signeesDraft.signee1, name: e.target.value } })}
                className="w-full p-1.5 border rounded uppercase"
              />
              <label className="block font-bold">Jabatan</label>
              <input
                type="text"
                value={signeesDraft.signee1.role}
                onChange={(e) => setSigneesDraft({ ...signeesDraft, signee1: { ...signeesDraft.signee1, role: e.target.value } })}
                className="w-full p-1.5 border rounded"
              />
              <button
                type="button"
                onClick={() => setActiveSignatureKey('signee1')}
                className="w-full py-1.5 bg-amber-100 text-amber-900 font-bold rounded"
              >
                Isi Tanda Tangan
              </button>
            </div>

            {/* Signee 2 */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl space-y-2">
              <label className="block font-bold">Kolom 2: Status</label>
              <input
                type="text"
                value={signeesDraft.signee2.title}
                onChange={(e) => setSigneesDraft({ ...signeesDraft, signee2: { ...signeesDraft.signee2, title: e.target.value } })}
                className="w-full p-1.5 border rounded"
              />
              <label className="block font-bold">Nama</label>
              <input
                type="text"
                value={signeesDraft.signee2.name}
                onChange={(e) => setSigneesDraft({ ...signeesDraft, signee2: { ...signeesDraft.signee2, name: e.target.value } })}
                className="w-full p-1.5 border rounded uppercase"
              />
              <label className="block font-bold">Jabatan</label>
              <input
                type="text"
                value={signeesDraft.signee2.role}
                onChange={(e) => setSigneesDraft({ ...signeesDraft, signee2: { ...signeesDraft.signee2, role: e.target.value } })}
                className="w-full p-1.5 border rounded"
              />
              <button
                type="button"
                onClick={() => setActiveSignatureKey('signee2')}
                className="w-full py-1.5 bg-amber-100 text-amber-900 font-bold rounded"
              >
                Isi Tanda Tangan
              </button>
            </div>

            {/* Signee 3 */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl space-y-2">
              <label className="block font-bold">Kolom 3: Status</label>
              <input
                type="text"
                value={signeesDraft.signee3.title}
                onChange={(e) => setSigneesDraft({ ...signeesDraft, signee3: { ...signeesDraft.signee3, title: e.target.value } })}
                className="w-full p-1.5 border rounded"
              />
              <label className="block font-bold">Nama</label>
              <input
                type="text"
                value={signeesDraft.signee3.name}
                onChange={(e) => setSigneesDraft({ ...signeesDraft, signee3: { ...signeesDraft.signee3, name: e.target.value } })}
                className="w-full p-1.5 border rounded uppercase"
              />
              <label className="block font-bold">Jabatan</label>
              <input
                type="text"
                value={signeesDraft.signee3.role}
                onChange={(e) => setSigneesDraft({ ...signeesDraft, signee3: { ...signeesDraft.signee3, role: e.target.value } })}
                className="w-full p-1.5 border rounded"
              />
              <button
                type="button"
                onClick={() => setActiveSignatureKey('signee3')}
                className="w-full py-1.5 bg-amber-100 text-amber-900 font-bold rounded"
              >
                Isi Tanda Tangan
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 text-center">
            {/* Column 1 */}
            <div className="p-4 flex flex-col justify-between min-h-[160px]">
              <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                {headerInfo.signee1?.title || 'Dibuat oleh'}
              </div>
              <div
                onClick={() => setActiveSignatureKey('signee1')}
                className="my-2 py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl flex items-center justify-center min-h-[60px] cursor-pointer"
              >
                {headerInfo.signee1?.signatureImage ? (
                  <img src={headerInfo.signee1.signatureImage} alt="TTD" className="h-12 max-h-12 object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Klik untuk Tanda Tangan</span>
                )}
              </div>
              <div className="font-bold text-xs uppercase text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-1">
                {headerInfo.signee1?.name || 'INDRAWAN'}
              </div>
            </div>

            {/* Column 2 */}
            <div className="p-4 flex flex-col justify-between min-h-[160px]">
              <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                {headerInfo.signee2?.title || 'Diperiksa oleh'}
              </div>
              <div
                onClick={() => setActiveSignatureKey('signee2')}
                className="my-2 py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl flex items-center justify-center min-h-[60px] cursor-pointer"
              >
                {headerInfo.signee2?.signatureImage ? (
                  <img src={headerInfo.signee2.signatureImage} alt="TTD" className="h-12 max-h-12 object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Klik untuk Tanda Tangan</span>
                )}
              </div>
              <div className="font-bold text-xs uppercase text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-1">
                {headerInfo.signee2?.name || 'AMIN SODIK'}
              </div>
            </div>

            {/* Column 3 */}
            <div className="p-4 flex flex-col justify-between min-h-[160px]">
              <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                {headerInfo.signee3?.title || 'Diketahui Oleh'}
              </div>
              <div
                onClick={() => setActiveSignatureKey('signee3')}
                className="my-2 py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl flex items-center justify-center min-h-[60px] cursor-pointer"
              >
                {headerInfo.signee3?.signatureImage ? (
                  <img src={headerInfo.signee3.signatureImage} alt="TTD" className="h-12 max-h-12 object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Klik untuk Tanda Tangan</span>
                )}
              </div>
              <div className="font-bold text-xs uppercase text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-1">
                {headerInfo.signee3?.name || 'ANTONIUS ANDRI WAROTO'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Reports Archive Modal */}
      <SavedReportsModal
        isOpen={isSavedReportsModalOpen}
        onClose={() => setIsSavedReportsModalOpen(false)}
        allReports={allReports}
        activeDate={headerInfo.reportDate}
        onSelectDate={(d) => {
          if (onSelectDate) onSelectDate(d);
        }}
        onDeleteDate={onDeleteDateReport}
        onOpenCopyYesterdayModal={onOpenCopyYesterdayModal}
      />

      {/* Delete Confirm Modal for Material */}
      <ConfirmDeleteModal
        isOpen={deleteTargetMaterial !== null}
        title="Hapus Jenis Pakan"
        message={
          deleteTargetMaterial
            ? `Apakah Anda yakin ingin menghapus jenis pakan "${deleteTargetMaterial.materialName}" (${deleteTargetMaterial.materialCode}) beserta seluruh data kavlingnya dari laporan stok?`
            : ''
        }
        confirmLabel="Hapus Pakan"
        onConfirm={() => {
          if (deleteTargetMaterial) {
            onDeleteMaterial(deleteTargetMaterial.id);
            setDeleteTargetMaterial(null);
          }
        }}
        onClose={() => setDeleteTargetMaterial(null)}
      />

      {/* Delete Confirm Modal for Kavling */}
      <ConfirmDeleteModal
        isOpen={deleteTargetKavling !== null}
        title="Hapus Kavling Pakan"
        message={
          deleteTargetKavling
            ? `Apakah Anda yakin ingin menghapus kavling "${deleteTargetKavling.kavCode}" dari jenis pakan ini?`
            : ''
        }
        confirmLabel="Hapus Kavling"
        onConfirm={() => {
          if (deleteTargetKavling) {
            onDeleteKavling(deleteTargetKavling.materialId, deleteTargetKavling.kavlingId);
            setDeleteTargetKavling(null);
          }
        }}
        onClose={() => setDeleteTargetKavling(null)}
      />

      {/* Edit Header Modal */}
      <EditHeaderModal
        isOpen={isEditHeaderModalOpen}
        headerInfo={headerInfo}
        onSave={(updatedHeader) => {
          if (setHeaderInfo) {
            setHeaderInfo(updatedHeader);
          }
        }}
        onClose={() => setIsEditHeaderModalOpen(false)}
      />

      {/* Signature Modal */}
      <SignatureModal
        isOpen={activeSignatureKey !== null}
        onClose={() => setActiveSignatureKey(null)}
        title={
          activeSignatureKey === 'signee1'
            ? (headerInfo.signee1?.title || 'Dibuat oleh')
            : activeSignatureKey === 'signee2'
            ? (headerInfo.signee2?.title || 'Diperiksa oleh')
            : (headerInfo.signee3?.title || 'Diketahui Oleh')
        }
        signeeName={
          activeSignatureKey === 'signee1'
            ? (headerInfo.signee1?.name || 'INDRAWAN')
            : activeSignatureKey === 'signee2'
            ? (headerInfo.signee2?.name || 'AMIN SODIK')
            : (headerInfo.signee3?.name || 'ANTONIUS ANDRI WAROTO')
        }
        currentSignature={
          activeSignatureKey === 'signee1'
            ? headerInfo.signee1?.signatureImage
            : activeSignatureKey === 'signee2'
            ? headerInfo.signee2?.signatureImage
            : headerInfo.signee3?.signatureImage
        }
        onSaveSignature={(signatureDataUrl) => {
          if (activeSignatureKey) {
            handleSaveSignature(activeSignatureKey, signatureDataUrl);
          }
        }}
      />

    </div>
  );
};

// Sub-component for Kavling Cells
interface KavlingCellsProps {
  kavling: KavlingItem;
  materialId: string;
  reportDate: string;
  onEditKavling: (materialId: string, kavling: KavlingItem) => void;
  onRequestDeleteKavling: (materialId: string, kavlingId: string, kavCode: string) => void;
  isLastInMaterial?: boolean;
}

const KavlingCells: React.FC<KavlingCellsProps> = ({
  kavling,
  materialId,
  reportDate,
  onEditKavling,
  onRequestDeleteKavling,
  isLastInMaterial = false,
}) => {
  const ageDays = calculateAgeInDays(kavling.productionDate, reportDate);
  const isJelek = kavling.kavCode.toLowerCase().includes('jelek') || kavling.quantity < 0;

  const bottomBorderClass = isLastInMaterial
    ? 'border-b-4 border-slate-900 dark:border-slate-500'
    : 'border-b border-slate-300 dark:border-slate-700';

  let ageBgClass = 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30';
  let ageBadge = 'bg-emerald-200 text-emerald-900';

  if (kavling.isBlockFeed) {
    ageBgClass = 'bg-purple-100 text-purple-950 font-semibold dark:bg-purple-950/50';
    ageBadge = 'bg-purple-700 text-white font-black';
  } else if (isJelek) {
    ageBgClass = 'bg-emerald-200 text-emerald-950 font-bold dark:bg-emerald-900/60';
    ageBadge = 'bg-emerald-400 text-emerald-950';
  } else if (ageDays >= 7) {
    ageBgClass = 'bg-amber-100 text-amber-950 font-semibold dark:bg-amber-950/40';
    ageBadge = 'bg-amber-300 text-amber-950 font-bold';
  } else if (ageDays >= 4) {
    ageBgClass = 'bg-yellow-50 text-yellow-950 dark:bg-yellow-950/30';
    ageBadge = 'bg-yellow-200 text-yellow-900';
  }

  return (
    <>
      <td className={`px-2 py-1.5 border-r-2 border-blue-600 dark:border-blue-500 ${bottomBorderClass} ${ageBgClass}`}>
        <div className="font-mono font-medium flex items-center justify-between gap-1">
          <span>{kavling.kavCode}</span>
          {kavling.isBlockFeed && (
            <span className="text-[9px] font-black uppercase bg-purple-700 text-white px-1.5 py-0.5 rounded tracking-wider shrink-0">
              BLOCK FEED
            </span>
          )}
        </div>
      </td>

      <td className={`px-2 py-1.5 border-r-2 border-blue-600 dark:border-blue-500 ${bottomBorderClass} font-mono text-xs ${ageBgClass}`}>
        {formatBatchNumber(kavling.batchNumber, kavling.productionDate)}
      </td>

      <td className={`text-right px-2 py-1.5 border-r-2 border-blue-600 dark:border-blue-500 ${bottomBorderClass} font-mono ${ageBgClass}`}>
        <span className={kavling.quantity < 0 ? 'text-rose-700 font-bold' : 'font-semibold'}>
          {formatNumber(kavling.quantity)}
        </span>
      </td>

      <td className={`text-center px-2 py-1.5 border-r-2 border-blue-600 dark:border-blue-500 ${bottomBorderClass} font-sans ${ageBgClass}`}>
        {formatDateIndonesian(kavling.productionDate, 'short')}
      </td>

      <td className={`text-center px-2 py-1.5 border-r-2 border-blue-600 dark:border-blue-500 ${bottomBorderClass} font-bold ${ageBgClass}`}>
        <span className={`px-1.5 py-0.5 rounded text-[11px] ${ageBadge}`}>
          {ageDays}
        </span>
      </td>

      <td className={`px-1 py-1 text-center border-r-2 border-blue-600 dark:border-blue-500 ${bottomBorderClass} bg-white dark:bg-slate-900 print:hidden`}>
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onEditKavling(materialId, kavling)}
            className="p-1 hover:bg-slate-100 text-slate-700 rounded transition-colors cursor-pointer"
            title="Edit Kavling"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRequestDeleteKavling(materialId, kavling.id, kavling.kavCode)}
            className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
            title="Hapus Kavling"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </>
  );
};
