import React from 'react';
import { FeedMaterial, ReportHeaderInfo } from '../types';
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

interface PrintViewProps {
  materials: FeedMaterial[];
  headerInfo: ReportHeaderInfo;
}

export const PrintView: React.FC<PrintViewProps> = ({ materials, headerInfo }) => {
  const totalStockAwal = materials.reduce((sum, m) => sum + (m.stockAwal || 0), 0);
  const totalProduksi = materials.reduce((sum, m) => sum + (m.produksi || 0), 0);
  const totalKiriman = materials.reduce((sum, m) => sum + (m.kirimanRetur || 0), 0);
  const totalDimuat = materials.reduce((sum, m) => sum + (m.dimuat || 0), 0);
  const totalBocor = materials.reduce((sum, m) => sum + (m.bocorRepro || 0), 0);
  const totalStockAkhir = materials.reduce((sum, m) => sum + calculateStockAkhir(m), 0);
  const totalKarungFisik = materials.reduce((sum, m) => sum + calculateTotalPhysicalKavling(m), 0);
  const totalKgFisik = materials.reduce(
    (sum, m) => sum + calculateTotalPhysicalKavling(m) * (m.weightPerBagKg || 50),
    0
  );

  return (
    <div id="printable-report" className="hidden print:block bg-white text-black p-4 font-sans text-xs max-w-[1200px] mx-auto">
      
      {/* Header Document */}
      <div className="border-b-2 border-black pb-3 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white font-black px-3 py-1 text-base tracking-wider rounded">
            JAPFA
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase">
              {headerInfo.reportTitle || 'TABEL FIFO & STOCK FISIK PAKAN TERNAK'}
            </h1>
            <p className="text-xs font-bold text-gray-800">
              {headerInfo.companyName || 'PT JAPFA COMFEED INDONESIA Tbk.'} - {headerInfo.unitLabel || 'JAPFA FEED'}
            </p>
          </div>
        </div>

        <div className="text-right text-xs font-mono font-semibold space-y-0.5">
          <div className="bg-gray-100 border border-black px-2 py-0.5 rounded text-[11px] font-bold inline-block mb-1">
            CODE: {headerInfo.documentCode || 'PLT - WRH - FM - 02 - 03'} ({headerInfo.documentVersion || 'Ver 1.4'})
          </div>
          <div>
            <strong>Tanggal Transaksi:</strong> {formatDateIndonesian(headerInfo.transactionDate, 'trans')}
          </div>
          <div>
            <strong>Tanggal Laporan:</strong> {formatDateIndonesian(headerInfo.reportDate, 'report')}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <table className="w-full border-collapse border border-black text-[10px] select-none">
        <thead>
          <tr className="bg-gray-200 text-center font-bold uppercase border-b border-black">
            <th rowSpan={2} className="border border-black p-1.5 w-[200px]">
              Jenis Pakan &amp; Kode Material
            </th>
            <th colSpan={6} className="border border-black p-1">
              STOCK
            </th>
            <th colSpan={5} className="border border-black p-1">
              Urutan Pengeluaran (FIFO)
            </th>
            <th colSpan={2} className="border border-black p-1">
              Grand Total
            </th>
          </tr>
          <tr className="bg-gray-100 text-center font-bold uppercase border-b border-black text-[9px]">
            <th className="border border-black p-1">Awal</th>
            <th className="border border-black p-1">Produksi</th>
            <th className="border border-black p-1">Kiriman</th>
            <th className="border border-black p-1">Dimuat</th>
            <th className="border border-black p-1">Bocor</th>
            <th className="border border-black p-1 font-extrabold bg-gray-300">Akhir</th>

            <th className="border border-black p-1">KAV</th>
            <th className="border border-black p-1">No Batch</th>
            <th className="border border-black p-1">Jumlah</th>
            <th className="border border-black p-1">Tgl Produksi</th>
            <th className="border border-black p-1">Umur(hari)</th>

            <th className="border border-black p-1">Karung</th>
            <th className="border border-black p-1">Kg</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {materials.map((m) => {
            const stockAkhirMutasi = calculateStockAkhir(m);
            const totalFisik = calculateTotalPhysicalKavling(m);
            const totalKg = totalFisik * (m.weightPerBagKg || 50);
            const sortedKavlings = sortKavlingsByFifoDate(m.kavlings);
            const kavCount = Math.max(1, sortedKavlings.length);

            return (
              <React.Fragment key={m.id}>
                <tr>
                  <td rowSpan={kavCount} className="border border-black border-b-2 border-b-black p-1.5 align-top font-sans font-bold">
                    <div className="uppercase">{m.materialName}</div>
                    <div className="text-[9px] font-mono font-semibold text-gray-700">({m.materialCode})</div>
                  </td>
                  <td rowSpan={kavCount} className="border border-black border-b-2 border-b-black p-1 text-right align-top">
                    {formatNumber(m.stockAwal)}
                  </td>
                  <td rowSpan={kavCount} className="border border-black border-b-2 border-b-black p-1 text-right align-top">
                    {m.produksi > 0 ? formatNumber(m.produksi) : ''}
                  </td>
                  <td rowSpan={kavCount} className="border border-black border-b-2 border-b-black p-1 text-right align-top">
                    {m.kirimanRetur > 0 ? formatNumber(m.kirimanRetur) : ''}
                  </td>
                  <td rowSpan={kavCount} className="border border-black border-b-2 border-b-black p-1 text-right align-top">
                    {m.dimuat > 0 ? formatNumber(m.dimuat) : ''}
                  </td>
                  <td rowSpan={kavCount} className="border border-black border-b-2 border-b-black p-1 text-right align-top">
                    {m.bocorRepro > 0 ? formatNumber(m.bocorRepro) : ''}
                  </td>
                  <td rowSpan={kavCount} className="border border-black border-b-2 border-b-black p-1 text-right align-top font-extrabold bg-gray-100">
                    {formatNumber(stockAkhirMutasi)}
                  </td>

                  {/* Kavling Row 1 */}
                  {sortedKavlings.length > 0 ? (
                    <>
                      <td className={`border border-black p-1 font-bold ${sortedKavlings.length <= 1 ? 'border-b-2 border-b-black' : ''}`}>
                        {sortedKavlings[0].kavCode}
                        {sortedKavlings[0].isBlockFeed && <span className="font-sans text-[8px] font-black uppercase text-purple-900 border border-purple-900 px-0.5 ml-1">BLOCK FEED</span>}
                      </td>
                      <td className={`border border-black p-1 font-mono text-[9px] ${sortedKavlings.length <= 1 ? 'border-b-2 border-b-black' : ''}`}>{formatBatchNumber(sortedKavlings[0].batchNumber, sortedKavlings[0].productionDate)}</td>
                      <td className={`border border-black p-1 text-right font-bold ${sortedKavlings.length <= 1 ? 'border-b-2 border-b-black' : ''}`}>{formatNumber(sortedKavlings[0].quantity)}</td>
                      <td className={`border border-black p-1 text-center font-sans ${sortedKavlings.length <= 1 ? 'border-b-2 border-b-black' : ''}`}>{formatDateIndonesian(sortedKavlings[0].productionDate, 'short')}</td>
                      <td className={`border border-black p-1 text-center font-bold ${sortedKavlings.length <= 1 ? 'border-b-2 border-b-black' : ''}`}>{calculateAgeInDays(sortedKavlings[0].productionDate, headerInfo.reportDate)}</td>
                    </>
                  ) : (
                    <td colSpan={5} className="border border-black border-b-2 border-b-black text-center text-gray-400">Tdk ada kavling</td>
                  )}

                  <td rowSpan={kavCount} className="border border-black border-b-2 border-b-black p-1 text-right align-top font-bold">
                    <div>{formatNumber(totalFisik)}</div>
                    {calculateBlockFeedPhysicalKavling(m) > 0 && (
                      <div className="text-[8px] font-bold text-purple-900 mt-0.5">
                        (+{formatNumber(calculateBlockFeedPhysicalKavling(m))} BF)
                      </div>
                    )}
                  </td>
                  <td rowSpan={kavCount} className="border border-black border-b-2 border-b-black p-1 text-right align-top font-bold">
                    {formatNumber(totalKg)}
                  </td>
                </tr>

                {/* Sub-rows */}
                {sortedKavlings.slice(1).map((kav, idx) => {
                  const isLast = idx === sortedKavlings.length - 2;
                  const borderBClass = isLast ? 'border-b-2 border-b-black' : '';
                  return (
                    <tr key={kav.id}>
                      <td className={`border border-black p-1 font-bold ${borderBClass}`}>
                        {kav.kavCode}
                        {kav.isBlockFeed && <span className="font-sans text-[8px] font-black uppercase text-purple-900 border border-purple-900 px-0.5 ml-1">BLOCK FEED</span>}
                      </td>
                      <td className={`border border-black p-1 font-mono text-[9px] ${borderBClass}`}>{formatBatchNumber(kav.batchNumber, kav.productionDate)}</td>
                      <td className={`border border-black p-1 text-right font-bold ${borderBClass}`}>{formatNumber(kav.quantity)}</td>
                      <td className={`border border-black p-1 text-center font-sans ${borderBClass}`}>{formatDateIndonesian(kav.productionDate, 'short')}</td>
                      <td className={`border border-black p-1 text-center font-bold ${borderBClass}`}>{calculateAgeInDays(kav.productionDate, headerInfo.reportDate)}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-300 font-bold text-center border-t-2 border-black">
            <td className="border border-black p-1.5">TOTAL KESELURUHAN</td>
            <td className="border border-black p-1 text-right">{formatNumber(totalStockAwal)}</td>
            <td className="border border-black p-1 text-right">{formatNumber(totalProduksi)}</td>
            <td className="border border-black p-1 text-right">{formatNumber(totalKiriman)}</td>
            <td className="border border-black p-1 text-right">{formatNumber(totalDimuat)}</td>
            <td className="border border-black p-1 text-right">{formatNumber(totalBocor)}</td>
            <td className="border border-black p-1 text-right font-extrabold">{formatNumber(totalStockAkhir)}</td>
            <td colSpan={5} className="border border-black p-1 text-center text-[9px]">REKAP FISIK KAVLING</td>
            <td className="border border-black p-1 text-right font-bold">{formatNumber(totalKarungFisik)}</td>
            <td className="border border-black p-1 text-right font-bold">{formatNumber(totalKgFisik)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Signatures */}
      <div className="mt-6 border border-black p-3 text-xs">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="w-1/3 py-1 font-semibold border-b border-black">{headerInfo.signee1?.title || 'Dibuat oleh'}</th>
              <th className="w-1/3 py-1 font-semibold border-b border-black">{headerInfo.signee2?.title || 'Diperiksa oleh'}</th>
              <th className="w-1/3 py-1 font-semibold border-b border-black">{headerInfo.signee3?.title || 'Diketahui Oleh'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="h-16 border-r border-black align-middle text-center p-1">
                {headerInfo.signee1?.signatureImage ? (
                  <img src={headerInfo.signee1.signatureImage} alt="TTD Dibuat oleh" className="h-14 max-h-14 max-w-full mx-auto object-contain" />
                ) : (
                  <span className="text-[10px] text-gray-400 font-mono">( Tanda Tangan )</span>
                )}
              </td>
              <td className="h-16 border-r border-black align-middle text-center p-1">
                {headerInfo.signee2?.signatureImage ? (
                  <img src={headerInfo.signee2.signatureImage} alt="TTD Diperiksa oleh" className="h-14 max-h-14 max-w-full mx-auto object-contain" />
                ) : (
                  <span className="text-[10px] text-gray-400 font-mono">( Tanda Tangan )</span>
                )}
              </td>
              <td className="h-16 align-middle text-center p-1">
                {headerInfo.signee3?.signatureImage ? (
                  <img src={headerInfo.signee3.signatureImage} alt="TTD Diketahui Oleh" className="h-14 max-h-14 max-w-full mx-auto object-contain" />
                ) : (
                  <span className="text-[10px] text-gray-400 font-mono">( Tanda Tangan )</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="border-t border-r border-black pt-2 font-bold uppercase">
                {headerInfo.signee1?.name || 'INDRAWAN'}
                <div className="font-normal text-[10px] normal-case">{headerInfo.signee1?.role || 'FG Worker Operation'}</div>
              </td>
              <td className="border-t border-r border-black pt-2 font-bold uppercase">
                {headerInfo.signee2?.name || 'AMIN SODIK'}
                <div className="font-normal text-[10px] normal-case">{headerInfo.signee2?.role || 'FG Supervisor'}</div>
              </td>
              <td className="border-t border-black pt-2 font-bold uppercase">
                {headerInfo.signee3?.name || 'ANTONIUS ANDRI WAROTO'}
                <div className="font-normal text-[10px] normal-case">{headerInfo.signee3?.role || 'Head Of WH Subdept'}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
