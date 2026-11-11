import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Package,
  Calendar,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit3,
  TrendingDown,
  TrendingUp,
  BarChart3,
  PieChart,
  RefreshCw,
  Info,
  ChevronRight,
  ExternalLink,
  Users,
  CalendarDays,
  RotateCcw,
  SlidersHorizontal,
  XCircle,
  Award,
  Copy
} from 'lucide-react';
import { MisloadIncident, MisloadCategory, MisloadStatus, FeedMaterial, UserAccount } from '../types';
import { MisloadIncidentModal } from './MisloadIncidentModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { formatDateIndonesian, formatNumber } from '../utils/fifoUtils';

interface MisloadDashboardViewProps {
  incidents: MisloadIncident[];
  onSaveIncident: (incident: MisloadIncident) => void;
  onDeleteIncident: (incidentId: string) => void;
  materials: FeedMaterial[];
  currentUser?: UserAccount | null;
}

const CATEGORY_LABELS: Record<MisloadCategory, { label: string; color: string; badgeBg: string }> = {
  salah_jenis: {
    label: 'Salah Jenis Pakan',
    color: 'text-rose-700 dark:text-rose-400',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  pelanggaran_fifo: {
    label: 'Pelanggaran FIFO / Kavling',
    color: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  selisih_kurang: {
    label: 'Selisih Kurang Karung',
    color: 'text-blue-700 dark:text-blue-400',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  selisih_lebih: {
    label: 'Selisih Lebih Karung',
    color: 'text-indigo-700 dark:text-indigo-400',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  karung_rusak: {
    label: 'Karung Rusak / Bocor',
    color: 'text-orange-700 dark:text-orange-400',
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  salah_truk: {
    label: 'Salah Truk / Ekspedisi',
    color: 'text-purple-700 dark:text-purple-400',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
};

const STATUS_LABELS: Record<MisloadStatus, { label: string; badgeBg: string }> = {
  investigasi: {
    label: 'Dalam Investigasi',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  selesai_tukar: {
    label: 'Selesai Ditukar',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  },
  retur_pabrik: {
    label: 'Retur Pabrik',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  },
  closed: {
    label: 'Selesai & Ditutup',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
};

const MONTH_OPTIONS = [
  { value: 'all', label: 'Semua Bulan' },
  { value: '01', label: 'Januari (01)' },
  { value: '02', label: 'Februari (02)' },
  { value: '03', label: 'Maret (03)' },
  { value: '04', label: 'April (04)' },
  { value: '05', label: 'Mei (05)' },
  { value: '06', label: 'Juni (06)' },
  { value: '07', label: 'Juli (07)' },
  { value: '08', label: 'Agustus (08)' },
  { value: '09', label: 'September (09)' },
  { value: '10', label: 'Oktober (10)' },
  { value: '11', label: 'November (11)' },
  { value: '12', label: 'Desember (12)' },
];

export const MisloadDashboardView: React.FC<MisloadDashboardViewProps> = ({
  incidents,
  onSaveIncident,
  onDeleteIncident,
  materials,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | '7d' | '30d'>('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incidentToEdit, setIncidentToEdit] = useState<MisloadIncident | null>(null);
  const [incidentToDelete, setIncidentToDelete] = useState<MisloadIncident | null>(null);

  // Pre-fill state for contextual actions (Save from specific date, operator, or category)
  const [initialCategoryForNew, setInitialCategoryForNew] = useState<MisloadCategory | undefined>(undefined);
  const [initialOperatorForNew, setInitialOperatorForNew] = useState<string | undefined>(undefined);
  const [initialDateForNew, setInitialDateForNew] = useState<string | undefined>(undefined);

  // Unified Action Handlers (Simpan / Tambah, Edit, Hapus)
  const handleCreateNew = (prefill?: { category?: MisloadCategory; operator?: string; date?: string }) => {
    setInitialCategoryForNew(prefill?.category);
    setInitialOperatorForNew(prefill?.operator);
    setInitialDateForNew(prefill?.date);
    setIncidentToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (incident: MisloadIncident) => {
    setIncidentToEdit(incident);
    setIsModalOpen(true);
  };

  const handleDelete = (incident: MisloadIncident) => {
    setIncidentToDelete(incident);
  };

  const handleDuplicateAndSave = (incident: MisloadIncident) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const duplicated: MisloadIncident = {
      ...incident,
      id: `misload-${Date.now()}`,
      incidentDate: todayStr,
      doNumber: `DO-${todayStr.replace(/-/g, '/')}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'investigasi',
      chronology: `[Salinan dari DO ${incident.doNumber}] ${incident.chronology}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: undefined,
    };
    onSaveIncident(duplicated);
  };

  // Available Years extracted dynamically from incidents
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    incidents.forEach((item) => {
      if (item.incidentDate && item.incidentDate.length >= 4) {
        set.add(item.incidentDate.slice(0, 4));
      }
    });
    set.add('2026');
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [incidents]);

  // Check if any filter is active
  const isAnyFilterActive =
    searchTerm.trim() !== '' ||
    selectedYear !== 'all' ||
    selectedMonth !== 'all' ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'all' ||
    periodFilter !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setPeriodFilter('all');
  };

  // Filtered incidents based on search text, year, month, category, status, and period
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      // Search
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const matchSearch =
          item.doNumber.toLowerCase().includes(term) ||
          item.truckPlateNumber.toLowerCase().includes(term) ||
          item.materialName.toLowerCase().includes(term) ||
          item.checkerName.toLowerCase().includes(term) ||
          item.expeditionName.toLowerCase().includes(term) ||
          (item.forkliftOperator && item.forkliftOperator.toLowerCase().includes(term)) ||
          (item.driverName && item.driverName.toLowerCase().includes(term)) ||
          (item.kavlingCode && item.kavlingCode.toLowerCase().includes(term)) ||
          (item.chronology && item.chronology.toLowerCase().includes(term));

        if (!matchSearch) return false;
      }

      // Year filter
      if (selectedYear !== 'all') {
        const itemYear = item.incidentDate ? item.incidentDate.slice(0, 4) : '';
        if (itemYear !== selectedYear) return false;
      }

      // Month filter
      if (selectedMonth !== 'all') {
        const itemMonth = item.incidentDate ? item.incidentDate.slice(5, 7) : '';
        if (itemMonth !== selectedMonth) return false;
      }

      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      // Period filter (applied if year and month are 'all')
      if (periodFilter !== 'all' && selectedYear === 'all' && selectedMonth === 'all') {
        const itemDate = new Date(item.incidentDate).getTime();
        const now = new Date().getTime();
        const diffDays = (now - itemDate) / (1000 * 3600 * 24);
        if (periodFilter === '7d' && diffDays > 7) return false;
        if (periodFilter === '30d' && diffDays > 30) return false;
      }

      return true;
    });
  }, [incidents, searchTerm, selectedYear, selectedMonth, selectedCategory, selectedStatus, periodFilter]);

  // Aggregate Metrics
  const totalIncidentsCount = filteredIncidents.length;
  const totalAffectedBags = filteredIncidents.reduce((sum, item) => sum + (item.affectedBags || 0), 0);
  const totalAffectedTon = (totalAffectedBags * 50) / 1000;
  const closedCount = filteredIncidents.filter((i) => i.status === 'closed' || i.status === 'selesai_tukar').length;
  const activeInvestigatingCount = filteredIncidents.filter((i) => i.status === 'investigasi').length;
  const resolutionRate = totalIncidentsCount > 0 ? Math.round((closedCount / totalIncidentsCount) * 100) : 100;

  // Category Distribution for Charts
  const categoryStats = useMemo(() => {
    const counts: Record<MisloadCategory, number> = {
      salah_jenis: 0,
      pelanggaran_fifo: 0,
      selisih_kurang: 0,
      selisih_lebih: 0,
      karung_rusak: 0,
      salah_truk: 0,
    };
    filteredIncidents.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category] += item.affectedBags;
      }
    });
    return counts;
  }, [filteredIncidents]);

  // Material Incident Frequency
  const materialStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; bags: number }> = {};
    filteredIncidents.forEach((item) => {
      const key = item.materialName || 'Lainnya';
      if (!map[key]) {
        map[key] = { name: key, count: 0, bags: 0 };
      }
      map[key].count += 1;
      map[key].bags += item.affectedBags;
    });
    return Object.values(map).sort((a, b) => b.bags - a.bags);
  }, [filteredIncidents]);

  // Forklift Operator Statistics (Grafik Operator Forklift)
  const operatorStats = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        count: number;
        bags: number;
        categories: Record<MisloadCategory, number>;
        dominantCategory: MisloadCategory;
        recentDate: string;
      }
    > = {};

    filteredIncidents.forEach((item) => {
      const opName = item.forkliftOperator?.trim() || 'Tidak Terdata / Helper';
      if (!map[opName]) {
        map[opName] = {
          name: opName,
          count: 0,
          bags: 0,
          categories: {
            salah_jenis: 0,
            pelanggaran_fifo: 0,
            selisih_kurang: 0,
            selisih_lebih: 0,
            karung_rusak: 0,
            salah_truk: 0,
          },
          dominantCategory: item.category,
          recentDate: item.incidentDate,
        };
      }
      map[opName].count += 1;
      map[opName].bags += item.affectedBags || 0;
      if (map[opName].categories[item.category] !== undefined) {
        map[opName].categories[item.category] += item.affectedBags || 0;
      }
      if (item.incidentDate > map[opName].recentDate) {
        map[opName].recentDate = item.incidentDate;
      }
    });

    // Determine dominant category per operator
    Object.values(map).forEach((op) => {
      let maxCat: MisloadCategory = 'salah_jenis';
      let maxVal = -1;
      (Object.keys(op.categories) as MisloadCategory[]).forEach((catKey) => {
        if (op.categories[catKey] > maxVal) {
          maxVal = op.categories[catKey];
          maxCat = catKey;
        }
      });
      op.dominantCategory = maxCat;
    });

    return Object.values(map).sort((a, b) => b.bags - a.bags || b.count - a.count);
  }, [filteredIncidents]);

  const maxOperatorBags = Math.max(1, ...operatorStats.map((o) => o.bags));

  // Date Trend Data (Group by date)
  const dateTrendStats = useMemo(() => {
    const map: Record<string, { date: string; incidents: number; bags: number }> = {};
    const sorted = [...filteredIncidents].sort((a, b) => a.incidentDate.localeCompare(b.incidentDate));
    sorted.forEach((item) => {
      const d = item.incidentDate;
      if (!map[d]) {
        map[d] = { date: d, incidents: 0, bags: 0 };
      }
      map[d].incidents += 1;
      map[d].bags += item.affectedBags;
    });
    return Object.values(map);
  }, [filteredIncidents]);

  const maxDailyBags = Math.max(1, ...dateTrendStats.map((d) => d.bags));

  // Quick Status Toggle (Mark resolved)
  const handleToggleStatus = (incident: MisloadIncident) => {
    const nextStatus: MisloadStatus = incident.status === 'closed' ? 'investigasi' : 'closed';
    onSaveIncident({
      ...incident,
      status: nextStatus,
      resolvedAt: nextStatus === 'closed' ? new Date().toISOString() : undefined,
    });
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'ID Insiden',
      'Tanggal',
      'No DO',
      'No Polisi Truk',
      'Ekspedisi',
      'Supir',
      'Jenis Pakan',
      'Kavling',
      'Kategori Kesalahan',
      'Karung Terdampak',
      'Checker',
      'Kronologi',
      'Tindakan Koreksi',
      'Status',
    ];

    const rows = filteredIncidents.map((i) => [
      i.id,
      i.incidentDate,
      i.doNumber,
      i.truckPlateNumber,
      i.expeditionName,
      i.driverName || '',
      i.materialName,
      i.kavlingCode || '',
      CATEGORY_LABELS[i.category]?.label || i.category,
      i.affectedBags,
      i.checkerName,
      `"${(i.chronology || '').replace(/"/g, '""')}"`,
      `"${(i.correctiveAction || '').replace(/"/g, '""')}"`,
      STATUS_LABELS[i.status]?.label || i.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kesalahan_Muat_JAPFA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-red-600 via-rose-700 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden border border-red-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 backdrop-blur-md text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ADMINISTRATION &amp; QC AUDIT
              </span>
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                Gudang Finished Goods JAPFA
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-amber-300" />
              <span>Dasbor Kesalahan Muat Pakan &amp; Audit FIFO</span>
            </h1>
            <p className="text-xs text-rose-100 max-w-2xl leading-relaxed">
              Monitoring penyimpangan pemuatan truk, pencegahan pelanggaran urutan FIFO kavling, dan pelacakan berita acara rekonsiliasi karung pakan.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
              title="Ekspor rekap insiden ke CSV/Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            {filteredIncidents.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => handleEdit(filteredIncidents[0])}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Edit Laporan Kejadian Terakhir"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Edit Kasus</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(filteredIncidents[0])}
                  className="bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-500/40 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Hapus Laporan Kejadian Terakhir"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  <span>Hapus Kasus</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handleCreateNew()}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
              title="Catat & Simpan Kesalahan Muat Baru"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>+ Simpan Kasus Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Insiden */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Kasus Kejadian</span>
            <div className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {totalIncidentsCount}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Insiden</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Aktif: <strong className="text-amber-600">{activeInvestigatingCount}</strong></span>
            <span>Terselesaikan: <strong className="text-emerald-600">{closedCount}</strong></span>
          </div>
        </div>

        {/* Card 2: Karung Terdampak */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Karung Pakan Terdampak</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {formatNumber(totalAffectedBags)}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Karung</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Setara bobot <strong>{totalAffectedTon.toFixed(1)} Ton</strong> pakan ternak
          </div>
        </div>

        {/* Card 3: Pelanggaran FIFO */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pelanggaran Urutan FIFO</span>
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
            {filteredIncidents.filter((i) => i.category === 'pelanggaran_fifo').length}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Kasus</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Salah pilih lot produksi lebih muda
          </div>
        </div>

        {/* Card 4: Tingkat Penyelesaian */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tingkat Penyelesaian (Closure)</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {resolutionRate}%
            <span className="text-xs font-normal text-slate-500 ml-1.5">Resolved</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {closedCount} dari {totalIncidentsCount} insiden selesai ditukar/koreksi
          </div>
        </div>

      </div>

      {/* Filter & Control Bar (Pencarian Per Bulan, Tahun, dan Per Kategori) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Pencarian &amp; Filter Data Kesalahan Muat
              </h3>
              <p className="text-[11px] text-slate-500">
                Saring data berdasarkan tahun, bulan, kategori kesalahan, operator forklift, atau status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Menampilkan <strong className="text-red-600 dark:text-red-400">{filteredIncidents.length}</strong> dari {incidents.length} Kejadian
            </span>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset semua filter pencarian"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Inputs & Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          
          {/* 1. Search Box */}
          <div className="sm:col-span-2 lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari DO, Nopol, Operator Forklift, Pakan, Checker, Ekspedisi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Filter Tahun */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Bulan */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-red-500"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filter Kategori */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Semua Kategori</option>
              <option value="salah_jenis">Salah Jenis Pakan</option>
              <option value="pelanggaran_fifo">Pelanggaran FIFO / Kavling</option>
              <option value="selisih_kurang">Selisih Kurang Karung</option>
              <option value="selisih_lebih">Selisih Lebih Karung</option>
              <option value="karung_rusak">Karung Rusak / Bocor</option>
              <option value="salah_truk">Salah Truk / Ekspedisi</option>
            </select>
          </div>

        </div>

        {/* Quick Filter Tag Row */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold">Filter Status:</span>
            {(['all', 'investigasi', 'selesai_tukar', 'retur_pabrik', 'closed'] as const).map((stKey) => {
              const isActive = selectedStatus === stKey;
              const label =
                stKey === 'all'
                  ? 'Semua Status'
                  : stKey === 'investigasi'
                  ? 'Investigasi'
                  : stKey === 'selesai_tukar'
                  ? 'Selesai Ditukar'
                  : stKey === 'retur_pabrik'
                  ? 'Retur Pabrik'
                  : 'Closed';

              return (
                <button
                  key={stKey}
                  type="button"
                  onClick={() => setSelectedStatus(stKey)}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Quick Relative Period Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setPeriodFilter('all');
                setSelectedYear('all');
                setSelectedMonth('all');
              }}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer ${
                periodFilter === 'all' && selectedYear === 'all' && selectedMonth === 'all'
                  ? 'bg-white dark:bg-slate-900 text-red-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Semua Periode
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter('7d');
                setSelectedYear('all');
                setSelectedMonth('all');
              }}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer ${
                periodFilter === '7d' ? 'bg-white dark:bg-slate-900 text-red-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter('30d');
                setSelectedYear('all');
                setSelectedMonth('all');
              }}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer ${
                periodFilter === '30d' ? 'bg-white dark:bg-slate-900 text-red-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              30 Hari Terakhir
            </button>
          </div>
        </div>

        {/* Quick Action Toolbar for Filter Section */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
            <span>Aksi Data Kesalahan Muat:</span>
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleCreateNew()}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Simpan / Catat Kejadian Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Simpan Kasus Baru</span>
            </button>

            <button
              type="button"
              disabled={filteredIncidents.length === 0}
              onClick={() => filteredIncidents[0] && handleEdit(filteredIncidents[0])}
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors ${
                filteredIncidents.length > 0
                  ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title="Edit Kasus Terpilih"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Kasus</span>
            </button>

            <button
              type="button"
              disabled={filteredIncidents.length === 0}
              onClick={() => filteredIncidents[0] && handleDelete(filteredIncidents[0])}
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors ${
                filteredIncidents.length > 0
                  ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title="Hapus Kasus Terpilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Kasus</span>
            </button>
          </div>
        </div>

      </div>

      {/* Visual Graphs Section (Grafik Analisis) */}
      <div className="space-y-4">
        
        {/* Row 1: Trend Kejadian & Distribusi Kategori */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Chart 1: Grafik Tren Insiden per Tanggal (2 Kolom Lebar) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-600" />
                  <span>Grafik Tren Kejadian &amp; Karung Terdampak per Tanggal</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Aktivitas pemantauan dispatch logistik harian unit pakan ({selectedMonth !== 'all' ? `Bulan ${selectedMonth}` : 'Semua Bulan'}{selectedYear !== 'all' ? ` / Tahun ${selectedYear}` : ''})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                  {dateTrendStats.length} Hari Aktif
                </span>
                <button
                  type="button"
                  onClick={() => handleCreateNew()}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Simpan Kasus Baru"
                >
                  <Plus className="w-3 h-3 text-slate-950" />
                  <span>+ Simpan Kasus</span>
                </button>
              </div>
            </div>

            {dateTrendStats.length > 0 ? (
              <div className="space-y-3 pt-2">
                <div className="h-52 flex items-end gap-3 sm:gap-6 pt-4 pb-2 px-2 overflow-x-auto">
                  {dateTrendStats.map((item) => {
                    const barHeightPct = Math.max(15, Math.round((item.bags / maxDailyBags) * 100));
                    return (
                      <div key={item.date} className="flex-1 min-w-[55px] flex flex-col items-center gap-1.5 group cursor-pointer">
                        {/* Tooltip & Value */}
                        <span className="text-[10px] font-mono font-black text-slate-700 dark:text-slate-300 opacity-90 group-hover:scale-110 transition-transform tabular-nums">
                          {item.bags} krg
                        </span>

                        {/* Bar Container */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl h-36 flex items-end p-1">
                          <div
                            style={{ height: `${barHeightPct}%` }}
                            className="w-full bg-gradient-to-t from-red-600 via-rose-500 to-amber-400 rounded-lg shadow-xs group-hover:brightness-110 transition-all flex items-start justify-center pt-1"
                          >
                            <span className="text-[9px] font-black text-white px-0.5">
                              {item.incidents}
                            </span>
                          </div>
                        </div>

                        {/* Date Label & Actions (Simpan, Edit, Hapus) */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-mono text-slate-500 font-bold whitespace-nowrap">
                            {formatDateIndonesian(item.date, 'short')}
                          </span>

                          {(() => {
                            const incsOnDate = incidents.filter((i) => i.incidentDate === item.date);
                            return (
                              <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateNew({ date: item.date });
                                  }}
                                  className="p-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300 transition-colors"
                                  title={`Simpan Kasus Baru pada ${formatDateIndonesian(item.date, 'short')}`}
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                                {incsOnDate.length > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(incsOnDate[0]);
                                      }}
                                      className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950 dark:text-blue-300 transition-colors"
                                      title={`Edit Kasus pada ${formatDateIndonesian(item.date, 'short')}`}
                                    >
                                      <Edit3 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(incsOnDate[0]);
                                      }}
                                      className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 transition-colors"
                                      title={`Hapus Kasus pada ${formatDateIndonesian(item.date, 'short')}`}
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                    <span>Tinggi Batang: Volume Karung Terdampak</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-800 text-white font-mono text-[9px] flex items-center justify-center font-bold">1</span>
                    <span>Angka di Batang: Jumlah Insiden</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                Belum ada data kejadian pemuatan pada periode / filter yang dipilih.
              </div>
            )}
          </div>

          {/* Chart 2: Grafik Distribusi Kategori Penyebab */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600" />
                <span>Distribusi Kategori Kesalahan</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Berdasarkan akumulasi jumlah karung pakan
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {(Object.keys(categoryStats) as MisloadCategory[]).map((catKey) => {
                const bags = categoryStats[catKey];
                const pct = totalAffectedBags > 0 ? Math.round((bags / totalAffectedBags) * 100) : 0;
                const catInfo = CATEGORY_LABELS[catKey];
                const incsInCat = incidents.filter((i) => i.category === catKey);

                return (
                  <div key={catKey} className="space-y-1 group/cat p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200 truncate pr-2">
                        {catInfo.label}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-slate-900 dark:text-white font-bold tabular-nums">
                          {bags} krg <span className="text-slate-400 font-normal">({pct}%)</span>
                        </span>

                        {/* Action buttons per Category: Simpan, Edit, Hapus */}
                        <div className="flex items-center gap-0.5 opacity-70 group-hover/cat:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleCreateNew({ category: catKey })}
                            className="p-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300 transition-colors"
                            title={`Simpan Kasus Baru untuk Kategori ${catInfo.label}`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                          {incsInCat.length > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEdit(incsInCat[0])}
                                className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950 dark:text-blue-300 transition-colors"
                                title={`Edit Kasus Terakhir Kategori ${catInfo.label}`}
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(incsInCat[0])}
                                className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 transition-colors"
                                title={`Hapus Kasus Terakhir Kategori ${catInfo.label}`}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all ${
                          catKey === 'pelanggaran_fifo'
                            ? 'bg-amber-500'
                            : catKey === 'salah_jenis'
                            ? 'bg-red-600'
                            : catKey === 'karung_rusak'
                            ? 'bg-orange-500'
                            : catKey === 'selisih_kurang'
                            ? 'bg-blue-500'
                            : catKey === 'selisih_lebih'
                            ? 'bg-indigo-500'
                            : 'bg-purple-600'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top Material Breakdown */}
            {materialStats.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Pakan Paling Sering Terlibat:
                </span>
                <div className="space-y-1.5">
                  {materialStats.slice(0, 3).map((m, idx) => (
                    <div key={m.name} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                        {idx + 1}. {m.name}
                      </span>
                      <span className="font-mono font-bold text-red-600 dark:text-red-400">
                        {m.bags} karung ({m.count}x)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Row 2: GRAFIK OPERATOR FORKLIFT (Chart Khusus Operator Forklift yang Salah Muat) */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Grafik Kesalahan Muat Berdasarkan Operator Forklift</span>
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                    Audit Kinerja
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Analisis perbandingan frekuensi insiden, akumulasi karung salah muat/rusak, dan kecenderungan kesalahan per operator forklift
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                {operatorStats.length} Operator Teridentifikasi
              </span>
            </div>
          </div>

          {operatorStats.length > 0 ? (
            <div className="space-y-4">
              
              {/* Operator Cards & Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {operatorStats.map((op, index) => {
                  const pct = totalAffectedBags > 0 ? Math.round((op.bags / totalAffectedBags) * 100) : 0;
                  const relativeBarPct = Math.max(15, Math.round((op.bags / maxOperatorBags) * 100));
                  const domCatInfo = CATEGORY_LABELS[op.dominantCategory];

                  return (
                    <div
                      key={op.name}
                      className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all space-y-3"
                    >
                      {/* Operator Info Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {/* Rank Badge */}
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              index === 0
                                ? 'bg-amber-400 text-slate-950 shadow-xs font-mono'
                                : index === 1
                                ? 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-200 font-mono'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 font-mono'
                            }`}
                          >
                            #{index + 1}
                          </div>

                          <div>
                            <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{op.name}</span>
                              {index === 0 && (
                                <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.2 rounded font-bold">
                                  Tertinggi
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              Operator Forklift Finished Goods
                            </span>
                          </div>
                        </div>

                        {/* Numeric Metric */}
                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-red-600 dark:text-red-400 font-mono tabular-nums leading-tight">
                            {formatNumber(op.bags)} <span className="text-xs font-bold text-slate-500">krg</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {((op.bags * 50) / 1000).toFixed(1)} Ton | {op.count} Kasus
                          </div>
                        </div>
                      </div>

                      {/* Visual Bar Indicator */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Kontribusi Volume Kesalahan</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{pct}% dari total</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-xl overflow-hidden p-0.5">
                          <div
                            style={{ width: `${relativeBarPct}%` }}
                            className={`h-full rounded-lg transition-all duration-500 ${
                              index === 0
                                ? 'bg-gradient-to-r from-red-600 to-amber-500'
                                : 'bg-gradient-to-r from-amber-500 to-orange-400'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Dominant Category & Detail Breakdown */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Dominan:</span>
                          <span className={`px-2 py-0.5 rounded-md font-bold ${domCatInfo.badgeBg}`}>
                            {domCatInfo.label}
                          </span>
                        </div>

                        <span className="text-slate-400 font-mono">
                          Terakhir: {formatDateIndonesian(op.recentDate, 'short')}
                        </span>
                      </div>

                      {/* Category Chips for this Operator */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {(Object.keys(op.categories) as MisloadCategory[]).map((catK) => {
                          const catBags = op.categories[catK];
                          if (catBags <= 0) return null;
                          return (
                            <span
                              key={catK}
                              className="text-[9px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {CATEGORY_LABELS[catK]?.label.replace('Selisih ', '').replace(' Karung', '')}: <strong className="text-slate-900 dark:text-white">{catBags} krg</strong>
                            </span>
                          );
                        })}
                      </div>

                      {/* Action Bar Operator: Simpan, Edit, Hapus */}
                      {(() => {
                        const opIncidents = incidents.filter(
                          (i) => i.forkliftOperator?.trim().toLowerCase() === op.name.toLowerCase()
                        );
                        return (
                          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleCreateNew({ operator: op.name })}
                              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title={`Simpan / Catat Kesalahan Muat Baru untuk ${op.name}`}
                            >
                              <Plus className="w-3 h-3 text-slate-950" />
                              <span>+ Simpan Kasus</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={opIncidents.length === 0}
                                onClick={() => opIncidents[0] && handleEdit(opIncidents[0])}
                                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors ${
                                  opIncidents.length > 0
                                    ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                }`}
                                title={`Edit Kasus Terakhir untuk ${op.name}`}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                disabled={opIncidents.length === 0}
                                onClick={() => opIncidents[0] && handleDelete(opIncidents[0])}
                                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors ${
                                  opIncidents.length > 0
                                    ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                }`}
                                title={`Hapus Kasus Terakhir untuk ${op.name}`}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  );
                })}
              </div>

              {/* Evaluasi Supervisor Guidance Note */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-bold">
                    Catatan Evaluasi Operasional Forklift &amp; Loading Master:
                  </p>
                  <p className="text-amber-800 dark:text-amber-300">
                    Insiden terbanyak operator forklift umumnya terkonsentrasi pada kesalahan pengambilan kavling (pelanggaran FIFO) dan handling yang menyebabkan karung sobek/bocor. Pastikan checker selalu melakukan verifikasi visual nomor kavling fisik sebelum garpu forklift mengangkat palet ke bak truk.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              Tidak ada catatan kesalahan muat operator forklift pada filter pencarian yang dipilih.
            </div>
          )}
        </div>

      </div>

      {/* Main Incidents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Log Berita Acara Kesalahan Muat &amp; Audit Koreksi
            </h3>
            <span className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
              {filteredIncidents.length} Catatan
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Menampilkan data pemuatan terverifikasi
            </span>
            <button
              type="button"
              onClick={() => handleCreateNew()}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Simpan / Catat Berita Acara Kesalahan Muat Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Simpan Kasus Baru</span>
            </button>
          </div>
        </div>

        {filteredIncidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Tanggal &amp; No DO</th>
                  <th className="p-3">Truk &amp; Ekspedisi</th>
                  <th className="p-3">Jenis Pakan &amp; Kavling</th>
                  <th className="p-3">Kategori Kesalahan</th>
                  <th className="p-3 text-right">Dampak Karung</th>
                  <th className="p-3">Petugas Checker</th>
                  <th className="p-3">Tindakan Koreksi</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                {filteredIncidents.map((incident) => {
                  const cat = CATEGORY_LABELS[incident.category] || {
                    label: incident.category,
                    badgeBg: 'bg-slate-100 text-slate-800',
                  };
                  const st = STATUS_LABELS[incident.status] || {
                    label: incident.status,
                    badgeBg: 'bg-slate-100 text-slate-800',
                  };

                  return (
                    <tr key={incident.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Tanggal & DO */}
                      <td className="p-3 align-top">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatDateIndonesian(incident.incidentDate, 'short')}
                        </div>
                        <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                          {incident.doNumber}
                        </div>
                      </td>

                      {/* Truk & Ekspedisi */}
                      <td className="p-3 align-top">
                        <div className="font-mono font-black text-slate-900 dark:text-white">
                          {incident.truckPlateNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {incident.expeditionName}
                        </div>
                        {incident.driverName && (
                          <div className="text-[10px] text-slate-400 italic">
                            Supir: {incident.driverName}
                          </div>
                        )}
                      </td>

                      {/* Material & Kavling */}
                      <td className="p-3 align-top">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {incident.materialName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {incident.materialCode}
                        </div>
                        {incident.kavlingCode && (
                          <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 border border-slate-300 dark:border-slate-700">
                            Kav: {incident.kavlingCode}
                          </span>
                        )}
                      </td>

                      {/* Kategori */}
                      <td className="p-3 align-top">
                        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}>
                          {cat.label}
                        </span>
                      </td>

                      {/* Dampak Karung */}
                      <td className="p-3 align-top text-right font-mono font-black tabular-nums">
                        <span className="text-red-600 dark:text-red-400 text-sm">
                          {formatNumber(incident.affectedBags)}
                        </span>
                        <span className="text-[10px] font-normal text-slate-500 block">
                          {(incident.affectedBags * 50) / 1000} Ton
                        </span>
                      </td>

                      {/* Checker & Forklift */}
                      <td className="p-3 align-top">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {incident.checkerName}
                        </div>
                        {incident.forkliftOperator && (
                          <div className="text-[10px] text-slate-500">
                            Forklift: {incident.forkliftOperator}
                          </div>
                        )}
                      </td>

                      {/* Kronologi & Koreksi */}
                      <td className="p-3 align-top max-w-[260px]">
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">
                          {incident.correctiveAction || incident.chronology}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="p-3 align-top text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(incident)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all cursor-pointer ${st.badgeBg}`}
                          title="Klik untuk ubah status cepat"
                        >
                          {st.label}
                        </button>
                      </td>

                      {/* Aksi: Simpan (Salin), Edit, Hapus */}
                      <td className="p-3 align-top text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicateAndSave(incident)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Simpan Salinan Kejadian Ini (Duplikasi & Simpan)"
                          >
                            <Copy className="w-3 h-3 text-emerald-600" />
                            <span>Simpan Salinan</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(incident)}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Data Kejadian Ini"
                          >
                            <Edit3 className="w-3 h-3 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(incident)}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Hapus Catatan Insiden"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Tidak ada catatan kesalahan muat pakan ditemukan
            </p>
            <p className="text-xs text-slate-400">
              Semua pemuatan pakan ke truk ekspedisi tercatat sesuai standar operasional.
            </p>
          </div>
        )}
      </div>

      {/* Incident Input / Edit Modal */}
      <MisloadIncidentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIncidentToEdit(null);
          setInitialCategoryForNew(undefined);
          setInitialOperatorForNew(undefined);
          setInitialDateForNew(undefined);
        }}
        onSave={onSaveIncident}
        onDelete={(id) => {
          onDeleteIncident(id);
          setIsModalOpen(false);
          setIncidentToEdit(null);
        }}
        incidentToEdit={incidentToEdit}
        materials={materials}
        currentUserName={currentUser?.fullName || currentUser?.username}
        initialCategory={initialCategoryForNew}
        initialOperator={initialOperatorForNew}
        initialDate={initialDateForNew}
      />

      {/* Confirm Delete Incident Modal */}
      <ConfirmDeleteModal
        isOpen={incidentToDelete !== null}
        title="Hapus Laporan Kesalahan Muat"
        message={
          incidentToDelete
            ? `Apakah Anda yakin ingin menghapus catatan kesalahan muat untuk DO ${incidentToDelete.doNumber} (Truk ${incidentToDelete.truckPlateNumber} - ${incidentToDelete.materialName})?`
            : ''
        }
        confirmLabel="Hapus Catatan"
        onConfirm={() => {
          if (incidentToDelete) {
            onDeleteIncident(incidentToDelete.id);
            setIncidentToDelete(null);
          }
        }}
        onClose={() => setIncidentToDelete(null)}
      />

    </div>
  );
};
