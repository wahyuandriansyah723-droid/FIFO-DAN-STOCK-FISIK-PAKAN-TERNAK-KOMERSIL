import React, { useState, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Layers,
  Printer,
  ChevronRight,
  Package,
  Calendar,
  Info,
  MapPin,
  ArrowRight,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  Database,
  Check
} from 'lucide-react';
import { FeedMaterial, KavlingItem } from '../types';
import { formatDateIndonesian, formatNumber } from '../utils/fifoUtils';

interface LoadingOrderDashboardViewProps {
  materials: FeedMaterial[];
  onOpenFifoModal?: () => void;
  reportDate?: string;
}

export interface LoadingOrderItem {
  materialId: string;
  materialName: string;
  materialCode: string;
  category?: 'pakan' | 'feed_add';
  kavCode: string;
  batchNumber: string;
  productionDate: string;
  ageDays: number;
  stockQty: number;
  stockTon: number;
  loadingSequence: number; // 1 for oldest, 2 for second, etc.
  statusLabel: string;
  statusType: 'ready_primary' | 'ready_queued' | 'hold_damaged' | 'empty';
  notes?: string;
  isBlockFeed?: boolean;
}

export const LoadingOrderDashboardView: React.FC<LoadingOrderDashboardViewProps> = ({
  materials,
  onOpenFifoModal,
  reportDate = new Date().toISOString().split('T')[0],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('all');
  const [selectedSequenceFilter, setSelectedSequenceFilter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');

  // Quick DO simulation state
  const [simMaterialId, setSimMaterialId] = useState<string>(materials[0]?.id || '');
  const [simQty, setSimQty] = useState<number>(200);

  // Today reference for calculating product age
  const refDateObj = useMemo(() => new Date(reportDate), [reportDate]);

  // Compute all loading order items across all materials
  const allLoadingItems: LoadingOrderItem[] = useMemo(() => {
    const items: LoadingOrderItem[] = [];

    materials.forEach((mat) => {
      // 1. Separate valid positive kavlings from damaged/empty ones
      const validKavlings = mat.kavlings.filter(
        (k) => k.quantity > 0 && !k.kavCode.toLowerCase().includes('jelek') && !k.kavCode.toLowerCase().includes('bocor')
      );

      const damagedKavlings = mat.kavlings.filter(
        (k) => k.quantity <= 0 || k.kavCode.toLowerCase().includes('jelek') || k.kavCode.toLowerCase().includes('bocor')
      );

      // 2. Sort valid kavlings by productionDate ascending (oldest first = FIFO Urutan 1)
      const sortedValid = [...validKavlings].sort((a, b) => {
        const dateCompare = a.productionDate.localeCompare(b.productionDate);
        if (dateCompare !== 0) return dateCompare;
        return a.kavCode.localeCompare(b.kavCode);
      });

      // 3. Map sorted valid kavlings to LoadingOrderItem
      sortedValid.forEach((kav, index) => {
        const prodDateObj = new Date(kav.productionDate);
        const diffMs = refDateObj.getTime() - prodDateObj.getTime();
        const ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const seq = index + 1;

        let statusType: LoadingOrderItem['statusType'] = 'ready_queued';
        let statusLabel = `URUTAN #${seq} (ANTREAN KE-${seq})`;

        if (seq === 1) {
          statusType = 'ready_primary';
          statusLabel = 'URUTAN #1 (MUAT SEKARANG - LOT TERTUA)';
        }

        // Generate batch number fallback if empty
        const batchNum = kav.batchNumber || `B-${kav.productionDate.replace(/-/g, '')}-${kav.kavCode.toUpperCase()}`;

        items.push({
          materialId: mat.id,
          materialName: mat.materialName,
          materialCode: mat.materialCode,
          category: mat.category,
          kavCode: kav.kavCode,
          batchNumber: batchNum,
          productionDate: kav.productionDate,
          ageDays,
          stockQty: kav.quantity,
          stockTon: (kav.quantity * (mat.weightPerBagKg || 50)) / 1000,
          loadingSequence: seq,
          statusLabel,
          statusType,
          notes: kav.notes,
          isBlockFeed: kav.isBlockFeed,
        });
      });

      // 4. Map damaged or negative kavlings
      damagedKavlings.forEach((kav) => {
        const prodDateObj = new Date(kav.productionDate);
        const diffMs = refDateObj.getTime() - prodDateObj.getTime();
        const ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const batchNum = kav.batchNumber || `B-${kav.productionDate.replace(/-/g, '')}-${kav.kavCode.toUpperCase()}`;

        items.push({
          materialId: mat.id,
          materialName: mat.materialName,
          materialCode: mat.materialCode,
          category: mat.category,
          kavCode: kav.kavCode,
          batchNumber: batchNum,
          productionDate: kav.productionDate,
          ageDays,
          stockQty: kav.quantity,
          stockTon: (Math.abs(kav.quantity) * (mat.weightPerBagKg || 50)) / 1000,
          loadingSequence: 999,
          statusLabel: 'DITAHAN / JANGAN DIMUAT (RUSAK / REPRO)',
          statusType: 'hold_damaged',
          notes: kav.notes || 'Stok rusak/repro, dilarang dimuat ke truk',
          isBlockFeed: kav.isBlockFeed,
        });
      });
    });

    return items;
  }, [materials, refDateObj]);

  // Filtered Items based on search and dropdowns
  const filteredItems = useMemo(() => {
    return allLoadingItems.filter((item) => {
      // Search filter
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const match =
          item.materialName.toLowerCase().includes(term) ||
          item.materialCode.toLowerCase().includes(term) ||
          item.kavCode.toLowerCase().includes(term) ||
          item.batchNumber.toLowerCase().includes(term) ||
          item.productionDate.includes(term);

        if (!match) return false;
      }

      // Material filter
      if (selectedMaterialFilter !== 'all' && item.materialId !== selectedMaterialFilter) {
        return false;
      }

      // Sequence filter
      if (selectedSequenceFilter === 'priority_1' && item.loadingSequence !== 1) {
        return false;
      }
      if (selectedSequenceFilter === 'queued' && (item.loadingSequence <= 1 || item.statusType === 'hold_damaged')) {
        return false;
      }
      if (selectedSequenceFilter === 'hold' && item.statusType !== 'hold_damaged') {
        return false;
      }

      return true;
    });
  }, [allLoadingItems, searchTerm, selectedMaterialFilter, selectedSequenceFilter]);

  // Summary Metrics
  const totalReadyLots = allLoadingItems.filter((i) => i.loadingSequence === 1).length;
  const totalReadyBags = allLoadingItems.filter((i) => i.loadingSequence === 1).reduce((sum, i) => sum + i.stockQty, 0);
  const totalAllKavlings = allLoadingItems.filter((i) => i.statusType !== 'hold_damaged').length;
  const totalAllBags = allLoadingItems.filter((i) => i.statusType !== 'hold_damaged').reduce((sum, i) => sum + i.stockQty, 0);

  // Live Real-Time Stock, Inbound & Outbound Synchronization Summary
  const syncSummary = useMemo(() => {
    let initialStock = 0;
    let inboundProd = 0;
    let inboundRet = 0;
    let inboundTot = 0;
    let outboundDim = 0;
    let outboundBoc = 0;
    let outboundTot = 0;
    let finalBookStock = 0;
    let totalPhysicalKav = 0;

    materials.forEach((m) => {
      const init = m.initialStockBags || 0;
      const inProd = m.inboundProduction || 0;
      const inRet = m.inboundReturn || 0;
      const inTot = m.inboundTotal ?? (inProd + inRet);
      const outDim = m.outboundLoaded || 0;
      const outBoc = m.outboundReproBocor || 0;
      const outTot = m.outboundTotal ?? (outDim + outBoc);
      const finalStk = m.finalStockBags ?? (init + inTot - outTot);

      initialStock += init;
      inboundProd += inProd;
      inboundRet += inRet;
      inboundTot += inTot;
      outboundDim += outDim;
      outboundBoc += outBoc;
      outboundTot += outTot;
      finalBookStock += finalStk;

      const physicalSum = m.kavlings.reduce((s, k) => s + (k.quantity || 0), 0);
      totalPhysicalKav += physicalSum;
    });

    return {
      initialStock,
      inboundProd,
      inboundRet,
      inboundTot,
      outboundDim,
      outboundBoc,
      outboundTot,
      finalBookStock,
      totalPhysicalKav,
      isFormulaBalanced: (initialStock + inboundTot - outboundTot) === finalBookStock,
    };
  }, [materials]);

  // Grouped by Material for Card View
  const groupedByMaterial = useMemo(() => {
    const map = new Map<string, LoadingOrderItem[]>();
    filteredItems.forEach((item) => {
      if (!map.has(item.materialId)) {
        map.set(item.materialId, []);
      }
      map.get(item.materialId)!.push(item);
    });
    return Array.from(map.entries()).map(([matId, list]) => {
      const mat = materials.find((m) => m.id === matId);
      return {
        materialId: matId,
        materialName: mat?.materialName || list[0].materialName,
        materialCode: mat?.materialCode || list[0].materialCode,
        kavlings: list,
      };
    });
  }, [filteredItems, materials]);

  // DO Truck Quick Simulation Logic
  const simulationResult = useMemo(() => {
    const mat = materials.find((m) => m.id === simMaterialId);
    if (!mat) return null;

    const validKavs = mat.kavlings
      .filter((k) => k.quantity > 0 && !k.kavCode.toLowerCase().includes('jelek'))
      .sort((a, b) => a.productionDate.localeCompare(b.productionDate));

    let remainingNeeded = simQty;
    const allocation: {
      kavCode: string;
      batchNumber: string;
      productionDate: string;
      seq: number;
      takeQty: number;
      remainingInKav: number;
      isExhausted: boolean;
    }[] = [];

    for (let i = 0; i < validKavs.length; i++) {
      if (remainingNeeded <= 0) break;
      const k = validKavs[i];
      const take = Math.min(k.quantity, remainingNeeded);
      remainingNeeded -= take;
      allocation.push({
        kavCode: k.kavCode,
        batchNumber: k.batchNumber || `B-${k.productionDate.replace(/-/g, '')}`,
        productionDate: k.productionDate,
        seq: i + 1,
        takeQty: take,
        remainingInKav: k.quantity - take,
        isExhausted: k.quantity - take === 0,
      });
    }

    return {
      materialName: mat.materialName,
      requestedQty: simQty,
      allocation,
      unallocatedQty: remainingNeeded,
    };
  }, [simMaterialId, simQty, materials]);

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden border border-emerald-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 backdrop-blur-md text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                LOADING MASTER &amp; FORKLIFT DISPATCH
              </span>
              <span className="bg-emerald-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                Sistem Pemuatan FIFO
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Truck className="w-7 h-7 text-emerald-300" />
              <span>Dasbor Urutan Muat Pakan &amp; Lokasi Kavling</span>
            </h1>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              Panduan pemuatan khusus operator forklift dan checker: menampilkan nama pakan, kavling, nomor batch, stok fisik, serta urutan prioritas yang wajib dimuat ke truk.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handlePrintSlip}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
              title="Cetak Instruksi Pemuatan untuk Clipboard Lapangan"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Slip Muat</span>
            </button>

            {onOpenFifoModal && (
              <button
                type="button"
                onClick={onOpenFifoModal}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Layers className="w-4 h-4 text-slate-950" />
                <span>Transaksi Barang Keluar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Synchronization Status & Reconciliation Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-xs text-emerald-400 tracking-wider uppercase">
                  ● SINKRONISASI REAL-TIME AKTIF
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                  Tersinkron Otomatis
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                Urutan muat FIFO terhubung langsung ke <strong>Data Stok Barang</strong>, <strong>Barang Masuk</strong> (Produksi &amp; Retur), dan <strong>Barang Keluar</strong> (Dimuat &amp; Bocor).
              </p>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-700 px-3 py-1.5 rounded-xl font-mono text-[11px] text-slate-300 flex items-center gap-2 flex-wrap">
            <span className="text-slate-400">Formula Stok:</span>
            <span className="text-amber-400 font-bold">{formatNumber(syncSummary.initialStock)}</span>
            <span className="text-emerald-400 font-bold">+{formatNumber(syncSummary.inboundTot)}</span>
            <span className="text-rose-400 font-bold">-{formatNumber(syncSummary.outboundTot)}</span>
            <span className="text-slate-400">=</span>
            <span className="text-white font-black bg-emerald-600/30 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-500/40">
              {formatNumber(syncSummary.finalBookStock)} Zak
            </span>
          </div>
        </div>

        {/* 3 Live Sync Breakdown Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          {/* Inbound Sync */}
          <div className="bg-slate-950/50 rounded-xl p-2.5 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Barang Masuk (Hari Ini)
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  Produksi: +{formatNumber(syncSummary.inboundProd)} | Retur: +{formatNumber(syncSummary.inboundRet)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-emerald-400 tabular-nums">
                +{formatNumber(syncSummary.inboundTot)}
              </div>
              <div className="text-[9px] text-emerald-500 font-mono">zak masuk</div>
            </div>
          </div>

          {/* Outbound Sync */}
          <div className="bg-slate-950/50 rounded-xl p-2.5 border border-rose-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Barang Keluar (Hari Ini)
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  Dimuat: -{formatNumber(syncSummary.outboundDim)} | Bocor: -{formatNumber(syncSummary.outboundBoc)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-rose-400 tabular-nums">
                -{formatNumber(syncSummary.outboundTot)}
              </div>
              <div className="text-[9px] text-rose-400 font-mono">zak keluar</div>
            </div>
          </div>

          {/* Book vs Physical Kavling Balance */}
          <div className="bg-slate-950/50 rounded-xl p-2.5 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Stok Buku &amp; Fisik Kavling
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  Buku: {formatNumber(syncSummary.finalBookStock)} | Kavling: {formatNumber(syncSummary.totalPhysicalKav)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-blue-400 tabular-nums">
                {formatNumber(syncSummary.finalBookStock)}
              </div>
              <div className="text-[9px] text-blue-400 font-mono">zak stok akhir</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Siap Muat Urutan 1 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Kavling Urutan #1 (Prioritas)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {totalReadyLots}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Kavling</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            Wajib dimuat pertama ({formatNumber(totalReadyBags)} Karung)
          </div>
        </div>

        {/* Card 2: Total Stok Siap Dimuat */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Stok Siap Muat
            </span>
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
            {formatNumber(totalAllBags)}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Karung</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Setara <strong>{((totalAllBags * 50) / 1000).toFixed(1)} Ton</strong> pakan ternak
          </div>
        </div>

        {/* Card 3: Total Kavling Aktif */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Lokasi Kavling Aktif
            </span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {totalAllKavlings}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Kavling</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dari {materials.length} jenis pakan ternak
          </div>
        </div>

        {/* Card 4: Kepatuhan FIFO */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Prosedur FIFO Loading
            </span>
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400">
            Strict FIFO
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Urutan 1 habis &rarr; lanjut Urutan 2
          </div>
        </div>

      </div>

      {/* Interactive Quick Simulation Drawer (Simulasi Pemuatan DO Truk) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-5 rounded-3xl border border-emerald-500/30 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
                Kalkulator Cepat Pemuatan Truk (Cek Urutan FIFO Otomatis)
              </h2>
              <p className="text-[11px] text-emerald-200/80">
                Masukkan kebutuhan karung pada Surat Jalan / DO untuk melihat kavling yang harus diambil saat ini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-700/50 px-2.5 py-1 rounded-full">
              Pencegahan Salah Kavling 100%
            </span>
          </div>
        </div>

        {/* Form Input Inline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Pilih Jenis Pakan Truk:</label>
            <select
              value={simMaterialId}
              onChange={(e) => setSimMaterialId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer focus:ring-2 focus:ring-emerald-400"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.materialName} ({m.materialCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Jumlah Karung Surat Jalan (DO):</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={simQty}
                onChange={(e) => setSimQty(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:ring-2 focus:ring-emerald-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                Karung ({((simQty * 50) / 1000).toFixed(1)} Ton)
              </span>
            </div>
          </div>

          <div className="flex items-end">
            <div className="text-[11px] text-slate-300 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 w-full">
              Status Alokasi:{' '}
              {simulationResult && simulationResult.unallocatedQty === 0 ? (
                <span className="text-emerald-400 font-bold">Stok Kavling Mencukupi</span>
              ) : (
                <span className="text-rose-400 font-bold">Kurang {simulationResult?.unallocatedQty} Karung</span>
              )}
            </div>
          </div>
        </div>

        {/* Simulation Output Roadmap */}
        {simulationResult && simulationResult.allocation.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Instruksi Ambil Forklift Sesuai Urutan FIFO:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {simulationResult.allocation.map((alloc) => (
                <div
                  key={alloc.kavCode}
                  className={`p-3 rounded-2xl border transition-all ${
                    alloc.seq === 1
                      ? 'bg-emerald-950/70 border-emerald-500/60 shadow-xs'
                      : 'bg-slate-800/80 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span
                      className={`font-black px-2 py-0.5 rounded-md text-[10px] ${
                        alloc.seq === 1 ? 'bg-emerald-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      URUTAN #{alloc.seq}
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      Tgl: {formatDateIndonesian(alloc.productionDate, 'short')}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white flex items-center justify-between mt-1">
                    <span>Kavling: <strong className="text-amber-300 font-mono text-sm">{alloc.kavCode}</strong></span>
                    <span className="font-mono text-emerald-300 font-black text-sm">
                      Ambil {formatNumber(alloc.takeQty)} Karung
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Batch: {alloc.batchNumber}</span>
                    <span>
                      {alloc.isExhausted ? (
                        <strong className="text-rose-300">Habis (0 krg)</strong>
                      ) : (
                        <span>Sisa kav: {formatNumber(alloc.remainingInKav)} krg</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Jenis Pakan, Kode Kavling (mis: b223), atau No Batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Material Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Pakan:</span>
            <select
              value={selectedMaterialFilter}
              onChange={(e) => setSelectedMaterialFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer max-w-[200px]"
            >
              <option value="all">Semua Jenis Pakan ({materials.length})</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.materialName}
                </option>
              ))}
            </select>
          </div>

          {/* Sequence Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Urutan:</span>
            <select
              value={selectedSequenceFilter}
              onChange={(e) => setSelectedSequenceFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">Semua Urutan</option>
              <option value="priority_1">Hanya Urutan #1 (Muat Sekarang)</option>
              <option value="queued">Urutan #2+ (Antrean Berikutnya)</option>
              <option value="hold">Kavling Ditahan (Rusak / Repro)</option>
            </select>
          </div>

          {/* Toggle Layout (Table vs Cards) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                viewLayout === 'table' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('cards')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                viewLayout === 'cards' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Kartu Pakan
            </button>
          </div>
        </div>

      </div>

      {/* Main Board View */}
      {viewLayout === 'table' ? (
        
        /* TABLE VIEW (Dedicated format: Jenis Pakan | Kav | No Batch | Stok | Urutan yang Bisa Dimuat) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Daftar Lengkap Kavling &amp; Urutan Pemuatan FIFO</span>
              </h2>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {filteredItems.length} Kavling Terdaftar
              </span>
            </div>

            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Data terurut otomatis berdasarkan tanggal produksi tertua (FIFO)
            </span>
          </div>

          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3">Jenis Pakan</th>
                    <th className="p-3">Kav</th>
                    <th className="p-3">No Batch / Tgl Produksi</th>
                    <th className="p-3 text-right">Stok Fisik Karung</th>
                    <th className="p-3 text-right">Tonase</th>
                    <th className="p-3 text-center">Urutan Yang Bisa Dimuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                  {filteredItems.map((item, idx) => {
                    const isUrutanSatu = item.loadingSequence === 1;
                    const isDamaged = item.statusType === 'hold_damaged';

                    return (
                      <tr
                        key={`${item.materialId}-${item.kavCode}-${idx}`}
                        className={`transition-colors ${
                          isUrutanSatu
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40'
                            : isDamaged
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* 1. Row Index */}
                        <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* 2. JENIS PAKAN */}
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900 dark:text-white">
                            {item.materialName}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px] text-slate-500 mt-0.5">
                            <span className="font-semibold">{item.materialCode}</span>
                            {(() => {
                              const pMat = materials.find((m) => m.id === item.materialId);
                              if (!pMat) return null;
                              return (
                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                  Stok: <strong>{formatNumber(pMat.finalStockBags || 0)}</strong> (Masuk +{pMat.inboundTotal || 0} | Keluar -{pMat.outboundTotal || 0})
                                </span>
                              );
                            })()}
                          </div>
                        </td>

                        {/* 3. KAV (KAVLING) */}
                        <td className="p-3">
                          <span
                            className={`inline-block font-mono font-black text-sm px-2.5 py-1 rounded-xl border uppercase tracking-wider ${
                              isUrutanSatu
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                : isDamaged
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {item.kavCode}
                          </span>
                        </td>

                        {/* 4. NO BATCH */}
                        <td className="p-3">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {item.batchNumber}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium">
                              Tgl: {formatDateIndonesian(item.productionDate, 'short')}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              Umur: {item.ageDays} Hari
                            </span>
                          </div>
                        </td>

                        {/* 5. STOK KARUNG */}
                        <td className="p-3 text-right">
                          <span
                            className={`text-base font-black font-mono tabular-nums ${
                              isUrutanSatu
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : isDamaged
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {formatNumber(item.stockQty)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal ml-1">krg</span>
                        </td>

                        {/* 6. TONASE */}
                        <td className="p-3 text-right font-mono font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                          {item.stockTon.toFixed(2)} Ton
                        </td>

                        {/* 7. URUTAN YANG BISA DIMUAT */}
                        <td className="p-3 text-center">
                          {isUrutanSatu ? (
                            <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs animate-pulse">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>URUTAN #1 (MUAT SEKARANG)</span>
                            </div>
                          ) : isDamaged ? (
                            <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-black text-xs px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>DITAHAN / JANGAN DIMUAT</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
                              <span>URUTAN #{item.loadingSequence}</span>
                              <span className="text-[10px] font-normal text-slate-500">
                                (Tunggu Urutan #{item.loadingSequence - 1} Habis)
                              </span>
                            </div>
                          )}
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
                Tidak ada data kavling yang cocok dengan filter pencarian
              </p>
              <p className="text-xs text-slate-400">
                Coba sesuaikan kata kunci pencarian atau pilih jenis pakan lainnya.
              </p>
            </div>
          )}
        </div>

      ) : (

        /* CARD VIEW (Grouped by Material for Floor Operations) */
        <div className="space-y-4">
          {groupedByMaterial.map((group) => {
            const primaryItem = group.kavlings.find((k) => k.loadingSequence === 1);
            const queuedItems = group.kavlings.filter((k) => k.loadingSequence > 1 && k.statusType !== 'hold_damaged');
            const damagedItems = group.kavlings.filter((k) => k.statusType === 'hold_damaged');

            return (
              <div
                key={group.materialId}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
              >
                {/* Header Card */}
                {(() => {
                  const pMat = materials.find((m) => m.id === group.materialId);
                  return (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-600" />
                          <span>{group.materialName}</span>
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap font-mono text-[10px] text-slate-500 mt-0.5">
                          <span>{group.materialCode}</span>
                          {pMat && (
                            <span className="text-[9px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-sans">
                              Stok Akhir: <strong>{formatNumber(pMat.finalStockBags || 0)}</strong> zak • Masuk: +{formatNumber(pMat.inboundTotal || 0)} • Keluar: -{formatNumber(pMat.outboundTotal || 0)}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[11px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full">
                        {group.kavlings.length} Kavling
                      </span>
                    </div>
                  );
                })()}

                {/* Body Roadmap */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Primary Urgent Lot (Urutan 1) */}
                  {primaryItem && (
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-4 rounded-2xl border-2 border-emerald-500 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>URUTAN #1: WAJIB DIMUAT SEKARANG</span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            (LOT PALING TUA)
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs pt-1">
                          <span>Lokasi Kav: <strong className="font-mono text-base font-black text-slate-900 dark:text-white uppercase">{primaryItem.kavCode}</strong></span>
                          <span>&bull;</span>
                          <span>No Batch: <strong className="font-mono text-slate-800 dark:text-slate-200">{primaryItem.batchNumber}</strong></span>
                          <span>&bull;</span>
                          <span>Tgl Produksi: {formatDateIndonesian(primaryItem.productionDate, 'short')} (Umur: {primaryItem.ageDays} Hari)</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {formatNumber(primaryItem.stockQty)} <span className="text-xs font-bold text-slate-500">krg</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {primaryItem.stockTon.toFixed(2)} Ton Pakan
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Queued Lots (Urutan 2, 3, dst.) */}
                  {queuedItems.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Antrean Pemuatan Berikutnya (Setelah Urutan #1 Habis):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {queuedItems.map((q) => (
                          <div
                            key={q.kavCode}
                            className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold px-2 py-0.2 rounded">
                                URUTAN #{q.loadingSequence}
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {formatNumber(q.stockQty)} krg
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="font-mono font-black text-slate-900 dark:text-white">
                                Kav: {q.kavCode}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Batch: {q.batchNumber}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-500 flex items-center justify-between">
                              <span>Tgl: {formatDateIndonesian(q.productionDate, 'short')}</span>
                              <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{q.ageDays} Hari</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Damaged Lots */}
                  {damagedItems.length > 0 && (
                    <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Kavling Ditahan (Bocor / Rusak): {damagedItems.map((d) => `${d.kavCode} (${d.stockQty} krg)`).join(', ')}</span>
                      </div>
                      <span className="font-bold text-[10px] uppercase">Dilarang Dimuat</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Operational Footer Instruction Note */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Standar Prosedur Operasional (SOP) Pemuatan Truk &amp; Forklift:
          </p>
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
            1. Operator forklift <strong>wajib mengambil palet dari Kavling Urutan #1</strong> terlebih dahulu hingga saldo kavling tersebut benar-benar habis sebelum berpindah ke kavling urutan berikutnya.<br />
            2. Periksa kembali kecocokan label fisik kavling dengan nomor DO sebelum palet dinaikkan ke bak truk untuk menghindari insiden salah jenis pakan atau pelanggaran FIFO.<br />
            3. Jika terdapat kavling berstatus &quot;DITAHAN / RUSAK&quot;, laporkan segera ke Petugas Checker untuk proses repro dan jangan dicampur ke muatan ekspedisi.
          </p>
        </div>
      </div>

    </div>
  );
};
