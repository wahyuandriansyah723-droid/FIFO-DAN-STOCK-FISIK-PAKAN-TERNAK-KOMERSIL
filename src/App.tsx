/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FeedMaterial,
  ReportHeaderInfo,
  KavlingItem,
  FifoPickResult,
  AllReportsMap,
  DailyReport,
  UserAccount,
  AppViewMode,
  MisloadIncident,
} from './types';
import { INITIAL_HEADER, INITIAL_FEED_MATERIALS } from './data/initialData';
import { INITIAL_USERS } from './data/initialUsers';
import { INITIAL_MISLOAD_INCIDENTS } from './data/initialMisloads';
import { SidebarNav } from './components/SidebarNav';
import { ReportTableView } from './components/ReportTableView';
import { FifoDispatchModal } from './components/FifoDispatchModal';
import { TransactionModal } from './components/TransactionModal';
import { FeedItemModal } from './components/FeedItemModal';
import { CopyYesterdayModal } from './components/CopyYesterdayModal';
import { ExportModal } from './components/ExportModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { AnalyticsView } from './components/AnalyticsView';
import { PrintView } from './components/PrintView';
import { LoginView } from './components/LoginView';
import { MasterDataUsersModal } from './components/MasterDataUsersModal';
import { MisloadDashboardView } from './components/MisloadDashboardView';
import { LoadingOrderDashboardView } from './components/LoadingOrderDashboardView';
import { calculateStockAkhir, calculateTotalPhysicalKavling, formatDateIndonesian } from './utils/fifoUtils';
import { useUndoRedo } from './hooks/useUndoRedo';
import { Undo2, Redo2 } from 'lucide-react';
import {
  db,
  REPORTS_COLLECTION,
  SETTINGS_COLLECTION,
  USERS_COLLECTION,
  MISLOADS_COLLECTION,
  APP_SETTINGS_DOC,
  PRESETS_DOC,
  saveReportToFirestore,
  deleteReportFromFirestore,
  saveActiveDateToFirestore,
  seedAllReportsToFirestore,
  seedInitialUsersToFirestore,
  saveMisloadIncidentToFirestore,
  deleteMisloadIncidentFromFirestore,
  seedInitialMisloadsToFirestore,
  signOutUser,
} from './lib/firebase';
import { setCachedPresets } from './data/feedPresets';
import { collection, doc, onSnapshot } from 'firebase/firestore';

const REPORTS_STORAGE_KEY = 'japfa_pakan_fifo_all_reports_v3';
const ACTIVE_DATE_STORAGE_KEY = 'japfa_pakan_fifo_active_date_v3';
const SESSION_USER_STORAGE_KEY = 'japfa_pakan_session_user_v4';

function loadInitialReports(): AllReportsMap {
  try {
    const savedAll = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (savedAll) {
      const parsed = JSON.parse(savedAll);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }

    // Fallback to legacy single-date localStorage if exists
    const legacyMaterialsStr = localStorage.getItem('japfa_pakan_fifo_report_data_v2');
    const legacyHeaderStr = localStorage.getItem('japfa_pakan_fifo_header_data_v2');

    const legacyHeader: ReportHeaderInfo = legacyHeaderStr ? JSON.parse(legacyHeaderStr) : INITIAL_HEADER;
    const legacyMaterials: FeedMaterial[] = legacyMaterialsStr ? JSON.parse(legacyMaterialsStr) : INITIAL_FEED_MATERIALS;

    const dateKey = legacyHeader.reportDate || '2026-07-21';
    return {
      [dateKey]: {
        headerInfo: legacyHeader,
        materials: legacyMaterials,
      },
    };
  } catch (err) {
    console.error('Failed to load initial reports map:', err);
    return {
      '2026-07-21': {
        headerInfo: INITIAL_HEADER,
        materials: INITIAL_FEED_MATERIALS,
      },
    };
  }
}

function loadInitialUser(): UserAccount | null {
  try {
    // Purge any persistent localStorage user credentials so exiting link always requires fresh login
    localStorage.removeItem('japfa_active_user_v2');
    localStorage.removeItem('japfa_pakan_auth_user_v3');
    localStorage.removeItem('japfa_pakan_auth_user_v2');
    localStorage.removeItem('japfa_pakan_auth_user');

    const sessionSaved = sessionStorage.getItem(SESSION_USER_STORAGE_KEY);
    if (sessionSaved) {
      const parsed = JSON.parse(sessionSaved);
      if (parsed && parsed.id && parsed.username) {
        return parsed;
      }
    }
    // Strict requirement: Always require login when entering/re-opening the link
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const initialReportsMap = loadInitialReports();

  const [activeDate, setActiveDate] = useState<string>('2026-07-21');

  // Authentication & Master Data Users State
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(loadInitialUser);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMasterUsersModalOpen, setIsMasterUsersModalOpen] = useState(false);

  // Misload Incidents (Kesalahan Muat Pakan) State
  const [misloadIncidents, setMisloadIncidents] = useState<MisloadIncident[]>(INITIAL_MISLOAD_INCIDENTS);

  const {
    state: allReports,
    setState: setAllReports,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount,
    futureCount,
  } = useUndoRedo<AllReportsMap>(initialReportsMap);

  // Firestore Real-Time Listeners
  useEffect(() => {
    let isInitialReports = true;

    // 1. Listen to dailyReports collection in Firestore
    const unsubscribeReports = onSnapshot(
      collection(db, REPORTS_COLLECTION),
      (snapshot) => {
        if (snapshot.empty && isInitialReports) {
          isInitialReports = false;
          const initialMap = loadInitialReports();
          const keys = Object.keys(initialMap);
          const defaultActive = keys[0] || '2026-07-21';
          seedAllReportsToFirestore(initialMap, defaultActive);

          try {
            localStorage.removeItem(REPORTS_STORAGE_KEY);
            localStorage.removeItem(ACTIVE_DATE_STORAGE_KEY);
            localStorage.removeItem('japfa_pakan_fifo_report_data_v2');
            localStorage.removeItem('japfa_pakan_fifo_header_data_v2');
          } catch {}
          return;
        }

        isInitialReports = false;
        const remoteReportsMap: AllReportsMap = {};
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          remoteReportsMap[docSnap.id] = {
            headerInfo: data.headerInfo || {
              ...INITIAL_HEADER,
              reportDate: docSnap.id,
              transactionDate: docSnap.id,
            },
            materials: data.materials || [],
          };
        });

        if (Object.keys(remoteReportsMap).length > 0) {
          setAllReports(remoteReportsMap);
        }
      },
      (err) => {
        console.error('Firestore reports listener error:', err);
      }
    );

    // 2. Listen to settings document in Firestore for activeDate
    const unsubscribeSettings = onSnapshot(
      doc(db, SETTINGS_COLLECTION, APP_SETTINGS_DOC),
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteActive = docSnap.data()?.activeDate;
          if (remoteActive) {
            setActiveDate(remoteActive);
          }
        }
      },
      (err) => {
        console.error('Firestore settings listener error:', err);
      }
    );

    // 3. Listen to presets document in Firestore
    const unsubscribePresets = onSnapshot(
      doc(db, SETTINGS_COLLECTION, PRESETS_DOC),
      (docSnap) => {
        if (docSnap.exists()) {
          const remotePresets = docSnap.data()?.presets;
          if (Array.isArray(remotePresets) && remotePresets.length > 0) {
            setCachedPresets(remotePresets);
          }
        }
      },
      (err) => {
        console.error('Firestore presets listener error:', err);
      }
    );

    // 4. Listen to users collection in Firestore (Master Data Pengguna)
    const unsubscribeUsers = onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot) => {
        if (snapshot.empty) {
          // Seed initial users into Firestore
          seedInitialUsersToFirestore(INITIAL_USERS);
          return;
        }

        const remoteUsers: UserAccount[] = [];
        snapshot.docs.forEach((docSnap) => {
          remoteUsers.push(docSnap.data() as UserAccount);
        });

        if (remoteUsers.length > 0) {
          const roleWeight: Record<string, number> = {
            admin: 1,
            operator: 2,
            supervisor: 3,
            viewer: 4,
          };
          remoteUsers.sort((a, b) => (roleWeight[a.role] || 9) - (roleWeight[b.role] || 9));
          setUsers(remoteUsers);

          // Sync current logged-in user with updated record
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const updated = remoteUsers.find((u) => u.id === prev.id || u.username === prev.username);
            if (updated) {
              if (updated.status === 'inactive') {
                try {
                  sessionStorage.removeItem(SESSION_USER_STORAGE_KEY);
                  localStorage.removeItem('japfa_active_user_v2');
                } catch {}
                return null;
              }
              try {
                sessionStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            }
            return prev;
          });
        }
      },
      (err) => {
        console.error('Firestore users listener error:', err);
      }
    );

    // 5. Listen to misloadIncidents collection in Firestore
    const unsubscribeMisloads = onSnapshot(
      collection(db, MISLOADS_COLLECTION),
      (snapshot) => {
        if (snapshot.empty) {
          seedInitialMisloadsToFirestore(INITIAL_MISLOAD_INCIDENTS);
          return;
        }

        const remoteIncidents: MisloadIncident[] = [];
        snapshot.docs.forEach((docSnap) => {
          remoteIncidents.push(docSnap.data() as MisloadIncident);
        });

        if (remoteIncidents.length > 0) {
          remoteIncidents.sort((a, b) => b.incidentDate.localeCompare(a.incidentDate));
          setMisloadIncidents(remoteIncidents);
        }
      },
      (err) => {
        console.error('Firestore misloads listener error:', err);
      }
    );

    return () => {
      unsubscribeReports();
      unsubscribeSettings();
      unsubscribePresets();
      unsubscribeUsers();
      unsubscribeMisloads();
    };
  }, []);

  // Login & Logout Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.removeItem('japfa_active_user_v2');
      localStorage.removeItem('japfa_pakan_auth_user_v3');
    } catch {}
    if (user.role === 'operator') {
      setViewMode('loading_board');
    }
    setIsLoginModalOpen(false);
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(SESSION_USER_STORAGE_KEY);
      localStorage.removeItem('japfa_active_user_v2');
      localStorage.removeItem('japfa_pakan_auth_user_v3');
    } catch {}
    setIsLoginModalOpen(false);
  };

  const handleUpdateCurrentUser = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(user));
    } catch {}
  };

  // Current active report
  const currentReport: DailyReport = allReports[activeDate] || {
    headerInfo: {
      ...INITIAL_HEADER,
      reportDate: activeDate,
      transactionDate: activeDate,
    },
    materials: INITIAL_FEED_MATERIALS,
  };

  const { headerInfo, materials } = currentReport;
  const availableDates = Object.keys(allReports).sort();

  // Setter for current date's materials
  const setMaterials = (updater: FeedMaterial[] | ((prev: FeedMaterial[]) => FeedMaterial[])) => {
    setAllReports((prevAll) => {
      const current = prevAll[activeDate]?.materials || INITIAL_FEED_MATERIALS;
      const updated = typeof updater === 'function' ? updater(current) : updater;
      const currentHead = prevAll[activeDate]?.headerInfo || {
        ...INITIAL_HEADER,
        reportDate: activeDate,
        transactionDate: activeDate,
      };

      const updatedReport: DailyReport = {
        headerInfo: currentHead,
        materials: updated,
      };

      saveReportToFirestore(activeDate, updatedReport);

      return {
        ...prevAll,
        [activeDate]: updatedReport,
      };
    });
  };

  // Setter for current date's headerInfo
  const setHeaderInfo = (updater: ReportHeaderInfo | ((prev: ReportHeaderInfo) => ReportHeaderInfo)) => {
    setAllReports((prevAll) => {
      const currentHead = prevAll[activeDate]?.headerInfo || {
        ...INITIAL_HEADER,
        reportDate: activeDate,
        transactionDate: activeDate,
      };
      const updatedHead = typeof updater === 'function' ? updater(currentHead) : updater;
      const currentMat = prevAll[activeDate]?.materials || INITIAL_FEED_MATERIALS;

      const newDateKey = updatedHead.reportDate;
      if (newDateKey && newDateKey !== activeDate) {
        const newReports = { ...prevAll };
        delete newReports[activeDate];
        const newReport: DailyReport = {
          headerInfo: updatedHead,
          materials: currentMat,
        };
        newReports[newDateKey] = newReport;

        deleteReportFromFirestore(activeDate);
        saveReportToFirestore(newDateKey, newReport);
        saveActiveDateToFirestore(newDateKey);
        setActiveDate(newDateKey);
        return newReports;
      }

      const updatedReport: DailyReport = {
        headerInfo: updatedHead,
        materials: currentMat,
      };
      saveReportToFirestore(activeDate, updatedReport);

      return {
        ...prevAll,
        [activeDate]: updatedReport,
      };
    });
  };

  // Select or Create Report Date
  const handleSelectDate = (targetDate: string) => {
    if (!targetDate) return;

    if (!allReports[targetDate]) {
      const sortedDates = Object.keys(allReports).sort();
      const priorDates = sortedDates.filter((d) => d < targetDate);
      const prevDate = priorDates.length > 0 ? priorDates[priorDates.length - 1] : sortedDates[0];

      let newMaterials: FeedMaterial[];
      if (prevDate && allReports[prevDate]) {
        newMaterials = allReports[prevDate].materials.map((m) => {
          const closing = calculateStockAkhir(m);
          return {
            ...m,
            stockAwal: closing,
            produksi: 0,
            kirimanRetur: 0,
            dimuat: 0,
            bocorRepro: 0,
            kavlings: m.kavlings.filter((k) => k.quantity > 0).map((k) => ({ ...k })),
          };
        });
      } else {
        newMaterials = INITIAL_FEED_MATERIALS;
      }

      const newHeader: ReportHeaderInfo = {
        ...(allReports[prevDate]?.headerInfo || INITIAL_HEADER),
        reportDate: targetDate,
        transactionDate: targetDate,
      };

      const newReport: DailyReport = {
        headerInfo: newHeader,
        materials: newMaterials,
      };

      saveReportToFirestore(targetDate, newReport);

      setAllReports((prevAll) => ({
        ...prevAll,
        [targetDate]: newReport,
      }));
    }

    setActiveDate(targetDate);
    saveActiveDateToFirestore(targetDate);
  };

  // Keyboard shortcut listener for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // View Mode State
  const [viewMode, setViewMode] = useState<AppViewMode>('table');

  // Strict Operator Role Guard: Operator can strictly access ONLY 'analytics' (Dashboard Awal) and 'loading_board' (Urutan Muat FIFO)
  useEffect(() => {
    if (currentUser?.role === 'operator') {
      if (viewMode !== 'analytics' && viewMode !== 'loading_board') {
        setViewMode('loading_board');
      }
    }
  }, [currentUser?.role, viewMode]);

  // Misload Incident Handlers
  const handleSaveMisloadIncident = (incident: MisloadIncident) => {
    setMisloadIncidents((prev) => {
      const idx = prev.findIndex((i) => i.id === incident.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = incident;
        return copy;
      }
      return [incident, ...prev];
    });
    saveMisloadIncidentToFirestore(incident);
  };

  const handleDeleteMisloadIncident = (incidentId: string) => {
    setMisloadIncidents((prev) => prev.filter((i) => i.id !== incidentId));
    deleteMisloadIncidentFromFirestore(incidentId);
  };

  // Modal States
  const [isAddFeedModalOpen, setIsAddFeedModalOpen] = useState(false);
  const [isFifoModalOpen, setIsFifoModalOpen] = useState(false);
  const [isCopyYesterdayModalOpen, setIsCopyYesterdayModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<FeedMaterial | null>(null);
  const [dateToDeleteReport, setDateToDeleteReport] = useState<string | null>(null);
  const [cannotDeleteNotice, setCannotDeleteNotice] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Copy stock carryover handler for next day
  const handleConfirmCopyYesterday = (newReportDate: string, newTransactionDate: string) => {
    const sourceMaterials = materials;
    const sourceHeader = headerInfo;

    const newMaterials = sourceMaterials.map((m) => {
      const closingStockYesterday = calculateStockAkhir(m);
      const activeKavlings = m.kavlings
        .filter((k) => k.quantity > 0)
        .map((k) => ({ ...k }));

      return {
        ...m,
        stockAwal: closingStockYesterday,
        produksi: 0,
        kirimanRetur: 0,
        dimuat: 0,
        bocorRepro: 0,
        kavlings: activeKavlings,
      };
    });

    const newHeader: ReportHeaderInfo = {
      ...sourceHeader,
      reportDate: newReportDate,
      transactionDate: newTransactionDate,
    };

    const newReport: DailyReport = {
      headerInfo: newHeader,
      materials: newMaterials,
    };

    saveReportToFirestore(newReportDate, newReport);
    saveActiveDateToFirestore(newReportDate);

    setAllReports((prevAll) => ({
      ...prevAll,
      [newReportDate]: newReport,
    }));

    setActiveDate(newReportDate);
  };

  // Delete an entire date's report
  const handleDeleteDateReport = (dateToDelete: string) => {
    const dates = Object.keys(allReports);
    if (dates.length <= 1) {
      setCannotDeleteNotice(true);
      return;
    }
    setDateToDeleteReport(dateToDelete);
  };

  const handleConfirmDeleteDateReport = () => {
    if (!dateToDeleteReport) return;
    const targetDate = dateToDeleteReport;

    deleteReportFromFirestore(targetDate);

    setAllReports((prevAll) => {
      const next = { ...prevAll };
      delete next[targetDate];
      return next;
    });

    const dates = Object.keys(allReports);
    const remainingDates = dates.filter((d) => d !== targetDate);
    if (remainingDates.length > 0) {
      const nextActive = remainingDates[remainingDates.length - 1] || remainingDates[0];
      setActiveDate(nextActive);
      saveActiveDateToFirestore(nextActive);
    }

    setDateToDeleteReport(null);
  };

  // Handlers
  const handleSaveEditedMaterial = (updated: FeedMaterial) => {
    setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleAddFeedMaterial = (newFeed: FeedMaterial) => {
    setMaterials((prev) => [...prev, newFeed]);
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleQuickAddKavling = (materialId: string, isBlockFeed: boolean = false) => {
    if (isBlockFeed) {
      const todayStr = activeDate || new Date().toISOString().split('T')[0];
      const batchStr = todayStr.slice(2).replace(/-/g, '');
      const newBlockFeedKavling: KavlingItem = {
        id: `kav-bf-${Date.now()}`,
        kavCode: `BF-B${Math.floor(Math.random() * 800 + 100)}`,
        batchNumber: batchStr,
        quantity: 200,
        productionDate: todayStr,
        isBlockFeed: true,
      };

      setMaterials((prev) =>
        prev.map((m) => {
          if (m.id === materialId) {
            return {
              ...m,
              kavlings: [...m.kavlings, newBlockFeedKavling],
            };
          }
          return m;
        })
      );
      return;
    }

    const target = materials.find((m) => m.id === materialId);
    if (target) {
      setEditingMaterial(target);
    }
  };

  const handleEditKavling = (materialId: string, _kavling: KavlingItem) => {
    const target = materials.find((m) => m.id === materialId);
    if (target) {
      setEditingMaterial(target);
    }
  };

  const handleDeleteKavling = (materialId: string, kavlingId: string) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          return {
            ...m,
            kavlings: m.kavlings.filter((k) => k.id !== kavlingId),
          };
        }
        return m;
      })
    );
  };

  // Process Outbound FIFO Dispatch (Dimuat or Bocor/Repro)
  const handleApplyDispatch = (
    materialId: string,
    dispatchQty: number,
    pickResult: FifoPickResult,
    dispatchType: 'dimuat' | 'bocorRepro' = 'dimuat'
  ) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id !== materialId) return m;

        const reductionMap = new Map<string, number>();
        pickResult.allocatedKavlings.forEach((alloc) => {
          reductionMap.set(alloc.kavCode, alloc.qtyAllocated);
        });

        const updatedKavlings = m.kavlings.map((k) => {
          const qtyToReduce = reductionMap.get(k.kavCode) || 0;
          return {
            ...k,
            quantity: Math.max(0, k.quantity - qtyToReduce),
          };
        });

        const currentVal = m[dispatchType] || 0;

        return {
          ...m,
          [dispatchType]: currentVal + dispatchQty,
          kavlings: updatedKavlings,
        };
      })
    );
  };

  // Reset data for active date
  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmResetData = () => {
    const resetReport: DailyReport = {
      headerInfo: {
        ...INITIAL_HEADER,
        reportDate: activeDate,
        transactionDate: activeDate,
      },
      materials: INITIAL_FEED_MATERIALS,
    };

    saveReportToFirestore(activeDate, resetReport);

    setAllReports((prevAll) => ({
      ...prevAll,
      [activeDate]: resetReport,
    }));
    setIsResetModalOpen(false);
  };

  // Export CSV/Excel File formatted for Indonesian Excel
  const handleExportExcel = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += `FIFO DAN STOCK FISIK PAKAN TERNAK (Satuan Dalam Karung)\n`;
    csvContent += `PT JAPFA COMFEED INDONESIA Tbk.\n`;
    csvContent += `Tanggal Transaksi: ${formatDateIndonesian(headerInfo.transactionDate, 'trans')}\tTanggal Laporan: ${formatDateIndonesian(headerInfo.reportDate, 'report')}\n\n`;

    csvContent += `Jenis Pakan;Kode Material;Stock Awal;Produksi;Kiriman/Retur;Dimuat;Bocor/Repro;Stock Akhir Mutasi;Kavling;Jumlah Karung;Tgl Production;Umur (Hari);Grand Total Karung;Grand Total Kg\n`;

    materials.forEach((m) => {
      const stockAkhir = calculateStockAkhir(m);
      const totalFisik = calculateTotalPhysicalKavling(m);
      const totalKg = totalFisik * 50;

      if (m.kavlings.length === 0) {
        csvContent += `"${m.materialName}";"${m.materialCode}";${m.stockAwal};${m.produksi};${m.kirimanRetur};${m.dimuat};${m.bocorRepro};${stockAkhir};"-";0;"-";0;${totalFisik};${totalKg}\n`;
      } else {
        m.kavlings.forEach((k, idx) => {
          if (idx === 0) {
            csvContent += `"${m.materialName}";"${m.materialCode}";${m.stockAwal};${m.produksi};${m.kirimanRetur};${m.dimuat};${m.bocorRepro};${stockAkhir};"${k.kavCode}";${k.quantity};"${k.productionDate}";"${formatDateIndonesian(k.productionDate, 'short')}";${totalFisik};${totalKg}\n`;
          } else {
            csvContent += `;;;;;;;"${k.kavCode}";${k.quantity};"${k.productionDate}";"${formatDateIndonesian(k.productionDate, 'short')}";;\n`;
          }
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_FIFO_Stock_Pakan_${headerInfo.reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // If user is logged out, render the full Login Screen Portal
  if (!currentUser) {
    return (
      <LoginView
        users={users}
        onLoginSuccess={handleLoginSuccess}
        currentUser={null}
        isModal={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-amber-300 selection:text-amber-900 print:bg-white print:text-black">
      
      {/* Left Navigation Sidebar */}
      <div className="print:hidden">
        <SidebarNav
          headerInfo={headerInfo}
          setHeaderInfo={setHeaderInfo}
          materials={materials}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenAddFeedModal={() => setIsAddFeedModalOpen(true)}
          onOpenFifoModal={() => setIsFifoModalOpen(true)}
          onOpenCopyYesterdayModal={() => setIsCopyYesterdayModalOpen(true)}
          onResetData={handleResetData}
          onExportExcel={() => setIsExportModalOpen(true)}
          onPrintReport={handlePrintReport}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          pastCount={pastCount}
          futureCount={futureCount}
          availableDates={availableDates}
          onSelectDate={handleSelectDate}
          currentUser={currentUser}
          onOpenMasterUsersModal={() => setIsMasterUsersModalOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Area (offset by sidebar width on large screens) */}
      <div className="lg:pl-72 transition-all">
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 print:p-0 print:m-0 print:max-w-none">
          
          {viewMode === 'table' && (
            <ReportTableView
              materials={materials}
              headerInfo={headerInfo}
              setHeaderInfo={setHeaderInfo}
              onEditMaterial={(mat) => setEditingMaterial(mat)}
              onDeleteMaterial={handleDeleteMaterial}
              onQuickAddKavling={handleQuickAddKavling}
              onEditKavling={handleEditKavling}
              onDeleteKavling={handleDeleteKavling}
              onOpenCopyYesterdayModal={() => setIsCopyYesterdayModalOpen(true)}
              availableDates={availableDates}
              onSelectDate={handleSelectDate}
              onDeleteDateReport={handleDeleteDateReport}
              onPrintReport={handlePrintReport}
              onExportExcel={() => setIsExportModalOpen(true)}
              currentUser={currentUser}
              onOpenMasterUsersModal={() => setIsMasterUsersModalOpen(true)}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              allReports={allReports}
              onGoToLoadingBoard={() => setViewMode('loading_board')}
            />
          )}

          {viewMode === 'fifo' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg font-bold mb-1">Simulasi Outbound FIFO</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Pilih pakan dan masukkan jumlah pengeluaran karung untuk menghitung urutan alokasi kavling tertua secara otomatis.
                </p>
                <button
                  onClick={() => setIsFifoModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Buka Generator Outbound FIFO
                </button>
              </div>

              <ReportTableView
                materials={materials}
                headerInfo={headerInfo}
                setHeaderInfo={setHeaderInfo}
                onEditMaterial={(mat) => setEditingMaterial(mat)}
                onDeleteMaterial={handleDeleteMaterial}
                onQuickAddKavling={handleQuickAddKavling}
                onEditKavling={handleEditKavling}
                onDeleteKavling={handleDeleteKavling}
                onOpenCopyYesterdayModal={() => setIsCopyYesterdayModalOpen(true)}
                availableDates={availableDates}
                onSelectDate={handleSelectDate}
                onDeleteDateReport={handleDeleteDateReport}
                onPrintReport={handlePrintReport}
                onExportExcel={() => setIsExportModalOpen(true)}
                currentUser={currentUser}
                onOpenMasterUsersModal={() => setIsMasterUsersModalOpen(true)}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                allReports={allReports}
                onGoToLoadingBoard={() => setViewMode('loading_board')}
              />
            </div>
          )}

          {viewMode === 'analytics' && (
            <AnalyticsView
              materials={materials}
              headerInfo={headerInfo}
              onOpenFifoModal={() => setIsFifoModalOpen(true)}
            />
          )}

          {viewMode === 'misload' && (
            <MisloadDashboardView
              incidents={misloadIncidents}
              onSaveIncident={handleSaveMisloadIncident}
              onDeleteIncident={handleDeleteMisloadIncident}
              materials={materials}
              currentUser={currentUser}
            />
          )}

          {viewMode === 'loading_board' && (
            <LoadingOrderDashboardView
              materials={materials}
              onOpenFifoModal={() => setIsFifoModalOpen(true)}
              reportDate={activeDate}
            />
          )}

        </main>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden">
          <p>
            Aplikasi Laporan FIFO & Stock Fisik Pakan Ternak (Satuan Dalam Karung) • PT JAPFA COMFEED INDONESIA Tbk.
          </p>
        </footer>
      </div>

      {/* Dedicated Clean Printable Sheet */}
      <PrintView materials={materials} headerInfo={headerInfo} />

      {/* Floating Undo / Redo Quick Widget (Visible on Screen) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md text-white p-1.5 px-2.5 rounded-2xl border border-slate-700/80 shadow-2xl print:hidden">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            canUndo
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
          <span className="font-extrabold">Undo</span>
          {pastCount > 0 && (
            <span className="bg-blue-800 text-blue-100 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
              {pastCount}
            </span>
          )}
        </button>

        <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            canRedo
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
          <span className="font-extrabold">Redo</span>
          {futureCount > 0 && (
            <span className="bg-indigo-800 text-indigo-100 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
              {futureCount}
            </span>
          )}
        </button>
      </div>

      {/* Dialog Modals */}
      <TransactionModal
        isOpen={!!editingMaterial}
        onClose={() => setEditingMaterial(null)}
        material={editingMaterial}
        onSave={handleSaveEditedMaterial}
        onDelete={handleDeleteMaterial}
      />

      <FeedItemModal
        isOpen={isAddFeedModalOpen}
        onClose={() => setIsAddFeedModalOpen(false)}
        onAddFeedMaterial={handleAddFeedMaterial}
        materials={materials}
        onDeleteMaterial={handleDeleteMaterial}
      />

      <FifoDispatchModal
        isOpen={isFifoModalOpen}
        onClose={() => setIsFifoModalOpen(false)}
        materials={materials}
        reportDate={headerInfo.reportDate}
        onApplyDispatch={handleApplyDispatch}
      />

      <CopyYesterdayModal
        isOpen={isCopyYesterdayModalOpen}
        onClose={() => setIsCopyYesterdayModalOpen(false)}
        headerInfo={headerInfo}
        materials={materials}
        onConfirmCopy={handleConfirmCopyYesterday}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        materials={materials}
        headerInfo={headerInfo}
        onPrintReport={handlePrintReport}
      />

      {/* Switch / Login User Modal */}
      {isLoginModalOpen && (
        <LoginView
          users={users}
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setIsLoginModalOpen(false)}
          isModal={true}
        />
      )}

      {/* Master Data Login & Pengguna Modal */}
      <MasterDataUsersModal
        isOpen={isMasterUsersModalOpen}
        onClose={() => setIsMasterUsersModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onUpdateCurrentUser={handleUpdateCurrentUser}
      />

      {/* Delete Date Report Modal */}
      <ConfirmDeleteModal
        isOpen={!!dateToDeleteReport}
        title={`Hapus Laporan Tanggal ${
          dateToDeleteReport ? formatDateIndonesian(dateToDeleteReport, 'short') : ''
        }?`}
        message={`Apakah Anda yakin ingin menghapus seluruh laporan stock dan FIFO untuk tanggal ${
          dateToDeleteReport ? formatDateIndonesian(dateToDeleteReport, 'full') : ''
        }? Seluruh data laporan tanggal ini akan terhapus permanen.`}
        confirmLabel="Hapus Laporan Ini"
        onConfirm={handleConfirmDeleteDateReport}
        onClose={() => setDateToDeleteReport(null)}
      />

      {/* Cannot Delete Last Report Notice Modal */}
      <ConfirmDeleteModal
        isOpen={cannotDeleteNotice}
        title="Tidak Dapat Menghapus Laporan"
        message="Harus ada minimal 1 laporan tersimpan dalam sistem. Anda tidak dapat menghapus tanggal laporan terakhir ini."
        confirmLabel="Mengerti"
        onConfirm={() => setCannotDeleteNotice(false)}
        onClose={() => setCannotDeleteNotice(false)}
      />

      {/* Reset Data Modal */}
      <ConfirmDeleteModal
        isOpen={isResetModalOpen}
        title={`Reset Data Laporan Tanggal ${formatDateIndonesian(activeDate, 'short')}?`}
        message="Seluruh data mutasi, penerimaan, pemuatan, dan kavling pada tanggal ini akan dikembalikan ke data sampel awal JAPFA."
        confirmLabel="Ya, Reset Data"
        onConfirm={handleConfirmResetData}
        onClose={() => setIsResetModalOpen(false)}
      />

    </div>
  );
}
