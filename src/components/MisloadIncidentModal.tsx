import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, Truck, Package, ShieldAlert, Calendar, Trash2 } from 'lucide-react';
import { MisloadIncident, MisloadCategory, MisloadStatus, FeedMaterial } from '../types';

interface MisloadIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incident: MisloadIncident) => void;
  onDelete?: (incidentId: string) => void;
  incidentToEdit: MisloadIncident | null;
  materials: FeedMaterial[];
  currentUserName?: string;
  initialCategory?: MisloadCategory;
  initialOperator?: string;
  initialDate?: string;
}

const CATEGORY_OPTIONS: { value: MisloadCategory; label: string; desc: string }[] = [
  { value: 'salah_jenis', label: 'Salah Jenis Pakan', desc: 'Tertukar kode atau nama pakan saat muat' },
  { value: 'pelanggaran_fifo', label: 'Pelanggaran FIFO / Kavling', desc: 'Mengambil kavling muda padahal kavling tua masih ada' },
  { value: 'selisih_kurang', label: 'Selisih Kurang Karung', desc: 'Jumlah karung termuat kurang dari DO' },
  { value: 'selisih_lebih', label: 'Selisih Lebih Karung', desc: 'Jumlah karung termuat lebih dari DO' },
  { value: 'karung_rusak', label: 'Karung Rusak / Bocor', desc: 'Karung sobek/bocor saat handling forklift atau muat' },
  { value: 'salah_truk', label: 'Salah Truk / Ekspedisi', desc: 'Tertukar muatan antar nomor polisi truk / tujuan' },
];

const STATUS_OPTIONS: { value: MisloadStatus; label: string }[] = [
  { value: 'investigasi', label: 'Dalam Investigasi' },
  { value: 'selesai_tukar', label: 'Selesai Ditukar / Koreksi Fisik' },
  { value: 'retur_pabrik', label: 'Retur ke Pabrik / Repro' },
  { value: 'closed', label: 'Selesai & Ditutup (Closed)' },
];

export const MisloadIncidentModal: React.FC<MisloadIncidentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  incidentToEdit,
  materials,
  currentUserName,
  initialCategory,
  initialOperator,
  initialDate,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [incidentDate, setIncidentDate] = useState<string>(todayStr);
  const [doNumber, setDoNumber] = useState<string>('');
  const [truckPlateNumber, setTruckPlateNumber] = useState<string>('');
  const [expeditionName, setExpeditionName] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [kavlingCode, setKavlingCode] = useState<string>('');
  const [category, setCategory] = useState<MisloadCategory>('salah_jenis');
  const [affectedBags, setAffectedBags] = useState<number>(10);
  const [lossEstimateRp, setLossEstimateRp] = useState<number>(0);
  const [checkerName, setCheckerName] = useState<string>(currentUserName || 'Petugas Checker');
  const [forkliftOperator, setForkliftOperator] = useState<string>('');
  const [chronology, setChronology] = useState<string>('');
  const [correctiveAction, setCorrectiveAction] = useState<string>('');
  const [status, setStatus] = useState<MisloadStatus>('investigasi');

  useEffect(() => {
    if (incidentToEdit) {
      setIncidentDate(incidentToEdit.incidentDate);
      setDoNumber(incidentToEdit.doNumber);
      setTruckPlateNumber(incidentToEdit.truckPlateNumber);
      setExpeditionName(incidentToEdit.expeditionName);
      setDriverName(incidentToEdit.driverName || '');
      setSelectedMaterialId(incidentToEdit.materialId || '');
      setKavlingCode(incidentToEdit.kavlingCode || '');
      setCategory(incidentToEdit.category);
      setAffectedBags(incidentToEdit.affectedBags);
      setLossEstimateRp(incidentToEdit.lossEstimateRp || 0);
      setCheckerName(incidentToEdit.checkerName);
      setForkliftOperator(incidentToEdit.forkliftOperator || '');
      setChronology(incidentToEdit.chronology);
      setCorrectiveAction(incidentToEdit.correctiveAction);
      setStatus(incidentToEdit.status);
    } else {
      setIncidentDate(initialDate || todayStr);
      setDoNumber(`DO-${(initialDate || todayStr).replace(/-/g, '/')}-${Math.floor(1000 + Math.random() * 9000)}`);
      setTruckPlateNumber('');
      setExpeditionName('');
      setDriverName('');
      const defaultMat = materials[0];
      if (defaultMat) {
        setSelectedMaterialId(defaultMat.id);
        setKavlingCode(defaultMat.kavlings[0]?.kavCode || '');
      }
      setCategory(initialCategory || 'salah_jenis');
      setAffectedBags(10);
      setLossEstimateRp(0);
      setCheckerName(currentUserName || 'Petugas Checker');
      setForkliftOperator(initialOperator || '');
      setChronology('');
      setCorrectiveAction('');
      setStatus('investigasi');
    }
  }, [incidentToEdit, isOpen, materials, currentUserName, todayStr, initialCategory, initialOperator, initialDate]);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mat = materials.find((m) => m.id === selectedMaterialId);

    const payload: MisloadIncident = {
      id: incidentToEdit ? incidentToEdit.id : `misload-${Date.now()}`,
      incidentDate,
      doNumber: doNumber.trim() || `DO-${incidentDate}`,
      truckPlateNumber: truckPlateNumber.trim().toUpperCase() || 'BELUM DIISI',
      expeditionName: expeditionName.trim() || 'Ekspedisi Rekanan',
      driverName: driverName.trim(),
      materialId: selectedMaterialId,
      materialName: mat ? mat.materialName : 'Pakan Ternak',
      materialCode: mat ? mat.materialCode : '-',
      kavlingCode: kavlingCode.trim(),
      category,
      affectedBags: Number(affectedBags) || 1,
      lossEstimateRp: Number(lossEstimateRp) || 0,
      checkerName: checkerName.trim() || 'Petugas Checker',
      forkliftOperator: forkliftOperator.trim(),
      chronology: chronology.trim() || 'Belum ada kronologi detail.',
      correctiveAction: correctiveAction.trim() || 'Sedang dalam penanganan.',
      status,
      createdAt: incidentToEdit ? incidentToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: status === 'closed' || status === 'selesai_tukar' ? new Date().toISOString() : undefined,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-red-600 via-rose-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <ShieldAlert className="w-6 h-6 text-red-200" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                {incidentToEdit ? 'Edit Laporan Kesalahan Muat Pakan' : 'Catat Kejadian Kesalahan Muat Baru'}
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Pencatatan Berita Acara Penyimpangan Pemuatan &amp; Pelanggaran FIFO
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          
          {/* Row 1: Tanggal & No DO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Tanggal Kejadian
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Nomor DO / Surat Jalan
              </label>
              <input
                type="text"
                value={doNumber}
                onChange={(e) => setDoNumber(e.target.value)}
                required
                placeholder="Contoh: DO-2026/07/21-0089"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white uppercase"
              />
            </div>
          </div>

          {/* Row 2: No Polisi Truk, Ekspedisi, Nama Supir */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                No. Polisi Truk
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={truckPlateNumber}
                  onChange={(e) => setTruckPlateNumber(e.target.value)}
                  required
                  placeholder="Contoh: BE 8821 UA"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Nama Ekspedisi / Armada
              </label>
              <input
                type="text"
                value={expeditionName}
                onChange={(e) => setExpeditionName(e.target.value)}
                placeholder="Contoh: PT Lintas Samudera"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Nama Supir (Driver)
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Contoh: Sutaryo Wibowo"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Row 3: Jenis Pakan & Kavling */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-4 h-4 text-red-600" />
              <span>Detail Pakan &amp; Lokasi Kavling Terlibat</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Pilih Jenis Pakan
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => {
                    setSelectedMaterialId(e.target.value);
                    const mat = materials.find((m) => m.id === e.target.value);
                    if (mat && mat.kavlings[0]) {
                      setKavlingCode(mat.kavlings[0].kavCode);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.materialName} ({m.materialCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Kavling / Lot Terkait
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={kavlingCode}
                    onChange={(e) => setKavlingCode(e.target.value)}
                    placeholder="Contoh: b223 atau B225"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase"
                  />
                  {selectedMaterial && selectedMaterial.kavlings.length > 0 && (
                    <select
                      onChange={(e) => setKavlingCode(e.target.value)}
                      value=""
                      className="bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-2 text-xs font-mono text-slate-700 dark:text-slate-200 cursor-pointer"
                      title="Pilih dari kavling yang tersedia"
                    >
                      <option value="" disabled>
                        Pilih Kavling
                      </option>
                      {selectedMaterial.kavlings.map((k) => (
                        <option key={k.id} value={k.kavCode}>
                          {k.kavCode} ({k.quantity} krg)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Kategori Kesalahan & Dampak Karung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Kategori Kesalahan Muat
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MisloadCategory)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {CATEGORY_OPTIONS.find((c) => c.value === category)?.desc}
              </p>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Jumlah Karung Terdampak
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={affectedBags}
                  onChange={(e) => setAffectedBags(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[11px]">
                  Karung (@50kg)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Setara {(Number(affectedBags) * 50) / 1000} Ton Pakan
              </p>
            </div>
          </div>

          {/* Row 5: Checker & Operator Forklift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Petugas Checker Gudang
              </label>
              <input
                type="text"
                value={checkerName}
                onChange={(e) => setCheckerName(e.target.value)}
                required
                placeholder="Nama Checker"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Operator Forklift / Helper
              </label>
              <input
                type="text"
                value={forkliftOperator}
                onChange={(e) => setForkliftOperator(e.target.value)}
                placeholder="Contoh: Heri Susanto"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Row 6: Kronologi & Tindakan Koreksi */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Kronologi Kejadian (Bagaimana kesalahan terjadi)
              </label>
              <textarea
                rows={2}
                value={chronology}
                onChange={(e) => setChronology(e.target.value)}
                placeholder="Jelaskan secara singkat urutan kejadian, misal: Operator mengambil kavling baru padahal kavling tua masih ada saldo..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white leading-relaxed resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Tindakan Koreksi &amp; Penanganan Fisik
              </label>
              <textarea
                rows={2}
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                placeholder="Tindakan yang diambil di tempat, misal: Muatan diturunkan kembali dan ditukar dengan kavling b223 sebelum truk berangkat..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Row 7: Status Insiden */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Status Penanganan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MisloadStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Estimasi Biaya / Kerugian (Rp) - Opsional
              </label>
              <input
                type="number"
                min={0}
                value={lossEstimateRp}
                onChange={(e) => setLossEstimateRp(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Modal Footer with Simpan, Edit, and Hapus actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
              >
                Batal
              </button>

              {incidentToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(incidentToEdit.id);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus Laporan Ini</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{incidentToEdit ? 'Simpan Perubahan (Update)' : 'Simpan Laporan Kesalahan Muat'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
