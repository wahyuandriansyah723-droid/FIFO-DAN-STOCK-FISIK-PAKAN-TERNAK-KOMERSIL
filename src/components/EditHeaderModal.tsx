import React, { useState, useEffect } from 'react';
import { X, FileText, Check, FileCode, Tag, Building2, Layout, Calendar } from 'lucide-react';
import { ReportHeaderInfo } from '../types';

interface EditHeaderModalProps {
  isOpen: boolean;
  headerInfo: ReportHeaderInfo;
  onSave: (updatedHeader: ReportHeaderInfo) => void;
  onClose: () => void;
}

export const EditHeaderModal: React.FC<EditHeaderModalProps> = ({
  isOpen,
  headerInfo,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<ReportHeaderInfo>({
    companyName: '',
    reportTitle: '',
    unitLabel: '',
    transactionDate: '',
    reportDate: '',
    documentCode: '',
    documentVersion: '',
  });

  useEffect(() => {
    if (headerInfo) {
      setFormData({
        companyName: headerInfo.companyName || 'PT. Japfa Comfeed Indonesia.Tbk',
        reportTitle: headerInfo.reportTitle || 'FIFO DAN STOCK FISIK PAKAN TERNAK',
        unitLabel: headerInfo.unitLabel || 'UNIT LPG.',
        transactionDate: headerInfo.transactionDate || '2026-07-20',
        reportDate: headerInfo.reportDate || '2026-07-21',
        documentCode: headerInfo.documentCode || 'PLT - WRH - FM - 02 - 03',
        documentVersion: headerInfo.documentVersion || 'Ver 1.4',
        signee1: headerInfo.signee1 || {
          title: 'Dibuat oleh',
          name: 'INDRAWAN',
          role: 'FG Worker Operation',
        },
        signee2: headerInfo.signee2 || {
          title: 'Diperiksa oleh',
          name: 'AMIN SODIK',
          role: 'FG Supervisor',
        },
        signee3: headerInfo.signee3 || {
          title: 'Diketahui Oleh',
          name: 'ANTONIUS ANDRI WAROTO',
          role: 'Head Of WH Subdept',
        },
      });
    }
  }, [headerInfo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">Edit Kode Dokumen &amp; Header Laporan</h2>
              <p className="text-xs text-slate-400">Sesuaikan informasi identitas dokumen &amp; unit laporan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Document Code & Version Group */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 p-3.5 rounded-xl space-y-3">
            <div className="font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Kode &amp; Versi Dokumen</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Dokumen (Document Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.documentCode || ''}
                  onChange={(e) => setFormData({ ...formData, documentCode: e.target.value })}
                  placeholder="Contoh: PLT - WRH - FM - 02 - 03"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Versi Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.documentVersion || ''}
                  onChange={(e) => setFormData({ ...formData, documentVersion: e.target.value })}
                  placeholder="Contoh: Ver 1.4"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Title & Company Details */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Layout className="w-3.5 h-3.5 text-slate-500" />
                <span>Judul Utama Laporan</span>
              </label>
              <input
                type="text"
                required
                value={formData.reportTitle}
                onChange={(e) => setFormData({ ...formData, reportTitle: e.target.value })}
                placeholder="Contoh: FIFO DAN STOCK FISIK PAKAN TERNAK"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nama Perusahaan</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="PT. Japfa Comfeed Indonesia.Tbk"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Label Unit / Lokasi</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.unitLabel}
                  onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
                  placeholder="UNIT LPG."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tanggal Transaksi</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tanggal Laporan</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.reportDate}
                  onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Signees / Penandatangan Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl space-y-3">
            <div className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Penandatangan Laporan (3 Kolom Lembar Pengesahan)</span>
            </div>

            {/* Signee 1 */}
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-[11px] text-amber-800 dark:text-amber-400">Kolom 1: Dibuat Oleh</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama (e.g. INDRAWAN)"
                  value={formData.signee1?.name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signee1: {
                        title: formData.signee1?.title || 'Dibuat oleh',
                        name: e.target.value,
                        role: formData.signee1?.role || 'FG Worker Operation',
                      },
                    })
                  }
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold uppercase"
                />
                <input
                  type="text"
                  placeholder="Jabatan (e.g. FG Worker Operation)"
                  value={formData.signee1?.role || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signee1: {
                        title: formData.signee1?.title || 'Dibuat oleh',
                        name: formData.signee1?.name || 'INDRAWAN',
                        role: e.target.value,
                      },
                    })
                  }
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
                />
              </div>
            </div>

            {/* Signee 2 */}
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-[11px] text-amber-800 dark:text-amber-400">Kolom 2: Diperiksa Oleh</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama (e.g. AMIN SODIK)"
                  value={formData.signee2?.name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signee2: {
                        title: formData.signee2?.title || 'Diperiksa oleh',
                        name: e.target.value,
                        role: formData.signee2?.role || 'FG Supervisor',
                      },
                    })
                  }
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold uppercase"
                />
                <input
                  type="text"
                  placeholder="Jabatan (e.g. FG Supervisor)"
                  value={formData.signee2?.role || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signee2: {
                        title: formData.signee2?.title || 'Diperiksa oleh',
                        name: formData.signee2?.name || 'AMIN SODIK',
                        role: e.target.value,
                      },
                    })
                  }
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
                />
              </div>
            </div>

            {/* Signee 3 */}
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-[11px] text-amber-800 dark:text-amber-400">Kolom 3: Diketahui Oleh</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama (e.g. ANTONIUS ANDRI WAROTO)"
                  value={formData.signee3?.name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signee3: {
                        title: formData.signee3?.title || 'Diketahui Oleh',
                        name: e.target.value,
                        role: formData.signee3?.role || 'Head Of WH Subdept',
                      },
                    })
                  }
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold uppercase"
                />
                <input
                  type="text"
                  placeholder="Jabatan (e.g. Head Of WH Subdept)"
                  value={formData.signee3?.role || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signee3: {
                        title: formData.signee3?.title || 'Diketahui Oleh',
                        name: formData.signee3?.name || 'ANTONIUS ANDRI WAROTO',
                        role: e.target.value,
                      },
                    })
                  }
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Kode &amp; Header</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
