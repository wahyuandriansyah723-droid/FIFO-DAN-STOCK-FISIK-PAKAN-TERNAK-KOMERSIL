export interface KavlingItem {
  id: string;
  kavCode: string;       // e.g. "b223", "a115", "barang jelek", "BF-101"
  batchNumber?: string;  // e.g. "B-260714-01"
  quantity: number;      // Karung quantity (can be negative for damaged/jelek)
  productionDate: string; // ISO date format YYYY-MM-DD or readable "2026-07-14"
  notes?: string;
  isBlockFeed?: boolean; // Special Block Feed kavling (isolated from standard grand totals)
}

export interface FeedMaterial {
  id: string;
  materialCode: string;   // e.g. "16021260004100"
  materialName: string;   // e.g. "BEST LAYER L TEPUNG"
  category?: 'pakan' | 'feed_add'; // 'pakan' (Pakan Utama/Jadi) or 'feed_add' (Bahan Pembantu)
  colorTheme: 'neutral' | 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'orange';
  weightPerBagKg: number; // default 50
  
  // Stock Mutations (in Karung)
  stockAwal: number;
  produksi: number;
  kirimanRetur: number;
  dimuat: number;
  bocorRepro: number;
  
  // Kavling details (Physical stock by location & age)
  kavlings: KavlingItem[];
}

export interface ReportSignee {
  title: string;
  name: string;
  role: string;
  signatureImage?: string; // base64 or image URL
}

export interface ReportHeaderInfo {
  companyName: string;
  reportTitle: string;
  unitLabel: string;
  transactionDate: string; // e.g. "2026-07-20"
  reportDate: string;      // e.g. "2026-07-21"
  documentCode?: string;   // e.g. "PLT - WRH - FM - 02 - 03"
  documentVersion?: string;// e.g. "Ver 1.4"
  signee1?: ReportSignee;  // Dibuat oleh
  signee2?: ReportSignee;  // Diperiksa oleh
  signee3?: ReportSignee;  // Diketahui Oleh
}

export interface DailyReport {
  headerInfo: ReportHeaderInfo;
  materials: FeedMaterial[];
}

export type AllReportsMap = Record<string, DailyReport>;

export interface FifoPickResult {
  materialId: string;
  materialName: string;
  requestedQty: number;
  allocatedKavlings: {
    kavCode: string;
    productionDate: string;
    ageDays: number;
    qtyAllocated: number;
    remainingInKav: number;
  }[];
  unallocatedQty: number;
}

export type UserRole = 'admin' | 'operator' | 'supervisor' | 'viewer';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  password?: string;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  isDefault?: boolean;
}

export interface AuthSession {
  user: UserAccount | null;
  isAuthenticated: boolean;
}

export type AppViewMode = 'table' | 'fifo' | 'analytics' | 'misload' | 'loading_board';

export type MisloadCategory =
  | 'salah_jenis'      // Salah Jenis Pakan (Tertukar kode / nama pakan)
  | 'pelanggaran_fifo' // Pelanggaran FIFO (Salah ambil kavling / bukan kavling tertua)
  | 'selisih_kurang'   // Selisih Kurang Karung
  | 'selisih_lebih'    // Selisih Lebih Karung
  | 'karung_rusak'     // Karung Bocor / Sobek Saat Pemuatan
  | 'salah_truk';      // Salah Truk / Tertukar Tujuan Ekspedisi

export type MisloadStatus = 'investigasi' | 'selesai_tukar' | 'retur_pabrik' | 'closed';

export interface MisloadIncident {
  id: string;
  incidentDate: string;     // YYYY-MM-DD
  doNumber: string;         // e.g. "DO-2026/07/21-0042"
  truckPlateNumber: string; // e.g. "L 9142 UQ"
  expeditionName: string;   // e.g. "PT Surya Logistics" / "Armada Sendiri"
  driverName?: string;      // e.g. "Bambang Sutrisno"
  materialId?: string;      // link to FeedMaterial id
  materialName: string;     // e.g. "BR - 1 (BROILER STARTER)"
  materialCode: string;     // e.g. "16021260004100"
  kavlingCode?: string;     // e.g. "b223"
  category: MisloadCategory;
  affectedBags: number;     // Jumlah karung salah muat (e.g. 20 karung)
  lossEstimateRp?: number;  // Estimasi biaya / retur handling
  checkerName: string;      // e.g. "Wahyu Andriansyah"
  forkliftOperator?: string;// e.g. "Sutrisno"
  chronology: string;       // Kronologi singkat kejadian
  correctiveAction: string; // Tindakan koreksi
  status: MisloadStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

