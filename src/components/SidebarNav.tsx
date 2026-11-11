import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  MapPin,
  X,
  Menu,
  Printer,
  Plus,
  RotateCcw,
  FileText,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Users,
  Shield,
  LogOut,
  UserCheck,
  KeyRound,
  ShieldAlert,
  ChevronRight,
  Truck
} from 'lucide-react';
import { ReportHeaderInfo, FeedMaterial, UserAccount, AppViewMode } from '../types';
import {
  calculateStockAkhir,
  calculateTotalPhysicalKavling,
  formatNumber,
  formatDateIndonesian
} from '../utils/fifoUtils';

interface SidebarNavProps {
  headerInfo: ReportHeaderInfo;
  setHeaderInfo: React.Dispatch<React.SetStateAction<ReportHeaderInfo>>;
  materials: FeedMaterial[];
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  onOpenAddFeedModal: () => void;
  onOpenFifoModal: () => void;
  onOpenCopyYesterdayModal?: () => void;
  onResetData: () => void;
  onExportExcel: () => void;
  onPrintReport: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  pastCount?: number;
  futureCount?: number;
  availableDates?: string[];
  onSelectDate?: (dateStr: string) => void;
  onDeleteDateReport?: (dateStr: string) => void;
  currentUser?: UserAccount | null;
  onOpenMasterUsersModal?: () => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  headerInfo,
  setHeaderInfo,
  materials,
  viewMode,
  setViewMode,
  onOpenAddFeedModal,
  onOpenFifoModal,
  onOpenCopyYesterdayModal,
  onResetData,
  onExportExcel,
  onPrintReport,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  pastCount = 0,
  futureCount = 0,
  availableDates,
  onSelectDate,
  onDeleteDateReport,
  currentUser,
  onOpenMasterUsersModal,
  onOpenLoginModal,
  onLogout,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Aggregate Metrics
  const totalMaterials = materials.length;
  const totalPhysicalKavling = materials.reduce(
    (sum, m) => sum + calculateTotalPhysicalKavling(m),
    0
  );
  const totalKg = totalPhysicalKavling * 50;

  const isAdmin = currentUser?.role === 'admin';
  const isOperator = currentUser?.role === 'operator' || isAdmin;
  const isOperatorOnly = currentUser?.role === 'operator';

  const handleMasterUsersClick = () => {
    setIsMobileOpen(false);
    if (!isAdmin) {
      alert(
        `Akses Terbatas: Akun Anda berperan sebagai ${currentUser?.role?.toUpperCase() || 'USER'}. Hanya Akun Kepala Gudang (Admin) yang dapat mengelola Master Data Pengguna & Kredensial Login.`
      );
      return;
    }
    if (onOpenMasterUsersModal) {
      onOpenMasterUsersModal();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 p-3 space-y-3.5 font-sans text-slate-800 dark:text-slate-200">
      
      {/* User Session Profile Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-3.5 shadow-md border-2 border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">
              JAPFA AUTH
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v2.5</span>
          </div>

          <div className="flex items-center gap-1">
            {onOpenLoginModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenLoginModal();
                  setIsMobileOpen(false);
                }}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                title="Ganti Akun Pengguna"
              >
                Ganti Akun
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setIsMobileOpen(false);
                }}
                className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0 border border-red-500/50">
            {currentUser?.fullName ? currentUser.fullName.slice(0, 1).toUpperCase() : 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-xs text-white truncate">
              {currentUser?.fullName || 'Petugas Tamu'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              @{currentUser?.username || 'tamu'} • {currentUser?.department || 'Gudang'}
            </div>
            <div className="mt-1">
              {currentUser?.role === 'admin' ? (
                <span className="bg-red-950/80 text-red-300 border border-red-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-red-400" />
                  Kepala Gudang (Admin)
                </span>
              ) : currentUser?.role === 'operator' ? (
                <span className="bg-blue-950/80 text-blue-300 border border-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
                  <UserCheck className="w-2.5 h-2.5 text-blue-400" />
                  Operator Gudang
                </span>
              ) : currentUser?.role === 'supervisor' ? (
                <span className="bg-amber-950/80 text-amber-300 border border-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
                  Supervisor QC
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Tamu / Viewer
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upper Navigation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-800/80 p-3.5 shadow-sm relative">
        {/* Top Tag */}
        <div className="mb-2">
          <span className={`font-black text-[10px] px-2 py-0.5 rounded tracking-widest uppercase inline-block ${
            isOperatorOnly ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
          }`}>
            {isOperatorOnly ? 'AKSES OPERATOR (FORKLIFT)' : 'MENU UTAMA'}
          </span>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
          <div>
            <h2 className="font-serif font-black text-xl text-slate-900 dark:text-white tracking-tight italic">
              {isOperatorOnly ? 'Navigasi Operator' : 'Navigasi Gudang'}
            </h2>
            {isOperatorOnly && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Mode Khusus: Dashboard Awal &amp; Urutan Muat FIFO
              </p>
            )}
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="mt-3.5 space-y-2">
          {/* 1. DASHBOARD AWAL */}
          <button
            onClick={() => {
              setViewMode('analytics');
              setIsMobileOpen(false);
            }}
            className={`w-full text-left p-2 rounded-xl border transition-all flex items-center gap-2.5 ${
              viewMode === 'analytics'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${viewMode === 'analytics' ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-600'}`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-tight">1. DASHBOARD AWAL</div>
              <div className={`text-[10px] font-medium ${viewMode === 'analytics' ? 'text-slate-300' : 'text-slate-500'}`}>
                Ringkasan Stok &amp; Analisis
              </div>
            </div>
          </button>

          {isOperatorOnly ? (
            /* 2. URUTAN MUAT FIFO (KHUSUS OPERATOR FORKLIFT) */
            <button
              onClick={() => {
                setViewMode('loading_board');
                setIsMobileOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                viewMode === 'loading_board'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-600 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${viewMode === 'loading_board' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'}`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-extrabold text-xs tracking-tight ${viewMode === 'loading_board' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      2. URUTAN MUAT FIFO
                    </span>
                    <span className={`${viewMode === 'loading_board' ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'} text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase`}>
                      FORKLIFT
                    </span>
                  </div>
                  <div className={`text-[10px] font-medium ${viewMode === 'loading_board' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    Pakan, Kav, Batch, Stok &amp; Urutan Muat
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${viewMode === 'loading_board' ? 'text-white' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform`} />
            </button>
          ) : (
            <>
              {/* 2. DATA STOCK BARANG */}
          <button
            onClick={() => {
              setViewMode('table');
              setIsMobileOpen(false);
            }}
            className={`w-full text-left p-2 rounded-xl border transition-all flex items-center gap-2.5 ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-600'}`}>
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-tight">2. DATA STOCK BARANG</div>
              <div className={`text-[10px] font-medium ${viewMode === 'table' ? 'text-slate-300' : 'text-slate-500'}`}>
                Buku Besar & Laporan
              </div>
            </div>
          </button>

          {/* 3. BARANG MASUK */}
          <button
            onClick={() => {
              onOpenAddFeedModal();
              setIsMobileOpen(false);
            }}
            className="w-full text-left p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                3. BARANG MASUK
              </div>
              <div className="text-[10px] font-medium text-slate-500">
                Penerimaan & Tambah Stok
              </div>
            </div>
          </button>

          {/* 4. BARANG KELUAR */}
          <button
            onClick={() => {
              onOpenFifoModal();
              setIsMobileOpen(false);
            }}
            className="w-full text-left p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-tight group-hover:text-rose-700 dark:group-hover:text-rose-400">
                4. BARANG KELUAR
              </div>
              <div className="text-[10px] font-medium text-slate-500">
                Pengeluaran & Transaksi FIFO
              </div>
            </div>
          </button>

          {/* 5. EDIT KAVLING */}
          <button
            onClick={() => {
              setViewMode('fifo');
              setIsMobileOpen(false);
            }}
            className="w-full text-left p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-tight group-hover:text-amber-700 dark:group-hover:text-amber-400">
                5. EDIT KAVLING
              </div>
              <div className="text-[10px] font-medium text-slate-500">
                Gudang & Identitas Lot
              </div>
            </div>
          </button>

          {/* 6. SALIN STOK KEMARIN */}
          <button
            onClick={() => {
              if (onOpenCopyYesterdayModal) onOpenCopyYesterdayModal();
              setIsMobileOpen(false);
            }}
            className="w-full text-left p-2 rounded-xl border border-blue-200 dark:border-blue-900/60 hover:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-blue-600 text-white group-hover:bg-blue-700 transition-colors">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-tight text-blue-700 dark:text-blue-400">
                6. SALIN STOK KEMARIN
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Lanjut ke Tanggal Berikutnya
              </div>
            </div>
          </button>

          {/* 7. MASTER DATA LOGIN & PENGGUNA */}
          <button
            onClick={handleMasterUsersClick}
            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
              isAdmin
                ? 'bg-gradient-to-r from-red-600/10 to-amber-500/10 border-red-300 dark:border-red-900/60 hover:border-red-500 hover:shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${isAdmin ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-white">
                    7. MASTER DATA USERNAME & EMAIL
                  </span>
                  {isAdmin && (
                    <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Master Kredensial Login & Akses
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* 8. KESALAHAN MUAT PAKAN (ADMIN DASHBOARD & GRAFIK) */}
          <button
            onClick={() => {
              setViewMode('misload');
              setIsMobileOpen(false);
            }}
            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
              viewMode === 'misload'
                ? 'bg-red-600 text-white border-red-600 shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-red-600 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${viewMode === 'misload' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'}`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-extrabold text-xs tracking-tight ${viewMode === 'misload' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    8. KESALAHAN MUAT PAKAN
                  </span>
                  <span className={`${viewMode === 'misload' ? 'bg-white text-red-600' : 'bg-red-600 text-white'} text-[9px] font-black px-1.5 py-0.2 rounded-full`}>
                    ADMIN
                  </span>
                </div>
                <div className={`text-[10px] font-medium ${viewMode === 'misload' ? 'text-red-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  Dasbor Investigasi &amp; Grafik
                </div>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${viewMode === 'misload' ? 'text-white' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform`} />
          </button>

          {/* 9. URUTAN MUAT FIFO (BOARD OPERATOR FORKLIFT) */}
          <button
            onClick={() => {
              setViewMode('loading_board');
              setIsMobileOpen(false);
            }}
            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
              viewMode === 'loading_board'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-600 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${viewMode === 'loading_board' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'}`}>
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-extrabold text-xs tracking-tight ${viewMode === 'loading_board' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    9. URUTAN MUAT FIFO
                  </span>
                  <span className={`${viewMode === 'loading_board' ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'} text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase`}>
                    FORKLIFT
                  </span>
                </div>
                <div className={`text-[10px] font-medium ${viewMode === 'loading_board' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  Pakan, Kav, Batch, Stok &amp; Urutan
                </div>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${viewMode === 'loading_board' ? 'text-white' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform`} />
          </button>
            </>
          )}
        </nav>
      </div>

      {/* Date Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 p-3.5 shadow-sm">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          RINGKASAN TANGGAL
        </div>
        <div className="font-serif italic font-bold text-sm text-slate-900 dark:text-amber-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
          {formatDateIndonesian(headerInfo.reportDate, 'full')}
        </div>

        {availableDates && availableDates.length > 0 && onSelectDate && (
          <div className="mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-800 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Buka Laporan Tanggal:
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={headerInfo.reportDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-900 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {formatDateIndonesian(d, 'short')} {d === headerInfo.reportDate ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
              {availableDates.length > 1 && onDeleteDateReport && isAdmin && (
                <button
                  type="button"
                  onClick={() => onDeleteDateReport(headerInfo.reportDate)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg transition-all cursor-pointer shrink-0"
                  title={`Hapus Seluruh Laporan Tanggal ${formatDateIndonesian(headerInfo.reportDate, 'short')}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Total Item:</span>
            <span className="font-bold text-slate-900 dark:text-white">{totalMaterials}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Stok Akhir:</span>
            <span className="font-bold text-slate-900 dark:text-emerald-400">
              {formatNumber(totalKg)} Kg
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {/* Undo & Redo Row (Hidden for operator) */}
        {!isOperatorOnly && (
          <div className="grid grid-cols-2 gap-2 pb-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                canUndo
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
              }`}
              title="Undo / Batal Perubahan Terakhir (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo {pastCount > 0 ? `(${pastCount})` : ''}</span>
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                canRedo
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
              }`}
              title="Redo / Ulangi Perubahan (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span>Redo {futureCount > 0 ? `(${futureCount})` : ''}</span>
            </button>
          </div>
        )}

        <button
          onClick={onPrintReport}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak PDF Laporan</span>
        </button>

        <button
          onClick={onExportExcel}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Export CSV / Excel</span>
        </button>

        {isAdmin && (
          <button
            onClick={onResetData}
            className="w-full text-slate-500 hover:text-rose-600 py-1 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Laporan Tanggal Ini</span>
          </button>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Mobile Bar Header */}
      <div className="lg:hidden bg-slate-900 text-white p-3 px-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-black px-2 py-0.5 rounded text-xs">
              JAPFA
            </span>
            <span className="font-extrabold text-xs tracking-tight truncate max-w-[130px] sm:max-w-[180px]">
              {headerInfo.reportTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-lg text-xs"
              title="Ganti Akun"
            >
              <div className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                {currentUser.fullName.slice(0, 1)}
              </div>
              <span className="text-[10px] font-bold text-slate-200 max-w-[70px] truncate">
                {currentUser.username}
              </span>
            </button>
          )}

          <button
            onClick={onPrintReport}
            className="p-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1"
            title="Cetak PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Permanent Left Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 z-30 print:hidden overflow-y-auto">
        {sidebarContent}
      </aside>
    </>
  );
};
