import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveTab, Kantin, IuranHarian, SchoolSettings, Pengeluaran, PemasukanLain, UserAccount } from './types';
import {
  loadKantinMaster,
  saveKantinMaster,
  loadIuranRecords,
  saveIuranRecords,
  loadPengeluaran,
  savePengeluaran,
  loadPemasukanLain,
  savePemasukanLain,
  loadSettings,
  saveSettings,
  loadCurrentSession,
  clearCurrentSession,
  resetToCleanData,
} from './utils/storage';
import { getTodayIsoString } from './utils/formatters';

import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DailyInputView } from './components/DailyInputView';
import { PengeluaranView } from './components/PengeluaranView';
import { PemasukanLainView } from './components/PemasukanLainView';
import { KantinMasterView } from './components/KantinMasterView';
import { ReportsCombinedView } from './components/ReportsCombinedView';
import { SettingsView } from './components/SettingsView';
import { CanteenOwnerPortalView } from './components/CanteenOwnerPortalView';
import { LoginView } from './components/LoginView';

import { QrisModal } from './components/QrisModal';
import { WaTemplateModal } from './components/WaTemplateModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { SyncNotificationBanner, SyncNotificationData } from './components/SyncNotificationBanner';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => loadCurrentSession());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [kantinList, setKantinList] = useState<Kantin[]>([]);
  const [iuranRecords, setIuranRecords] = useState<IuranHarian[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
  const [pemasukanLainList, setPemasukanLainList] = useState<PemasukanLain[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(loadSettings());

  // Auto-Refresh & Offline-Online Sync States
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(() => new Date());
  const [autoRefreshOnReturn, setAutoRefreshOnReturn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kantin_auto_refresh_on_return') !== 'false';
    } catch {
      return true;
    }
  });
  const [periodicSyncEnabled, setPeriodicSyncEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kantin_periodic_sync') !== 'false';
    } catch {
      return true;
    }
  });
  const [syncNotification, setSyncNotification] = useState<SyncNotificationData | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Portal Canteen Owner view mode
  const [portalKantinTarget, setPortalKantinTarget] = useState<Kantin | null>(null);
  const [isDirectLink, setIsDirectLink] = useState<boolean>(false);

  // Modals state
  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [waModalTarget, setWaModalTarget] = useState<{ kantin: Kantin; customTanggal?: string } | null>(null);

  // Notification helper
  const triggerNotification = useCallback((type: 'online' | 'offline' | 'synced', message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setSyncNotification({
      type,
      message,
      timestamp: Date.now(),
    });
    // Auto dismiss after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setSyncNotification(null);
    }, 5000);
  }, []);

  // Core Refresh Function
  const refreshAllData = useCallback(
    (source: 'initial' | 'online' | 'focus' | 'manual' | 'storage' | 'periodic' = 'manual') => {
      setIsSyncing(true);

      try {
        const loadedKantin = loadKantinMaster();
        const loadedRecords = loadIuranRecords();
        const loadedPengeluaran = loadPengeluaran();
        const loadedPemasukanLain = loadPemasukanLain();
        const loadedSettings = loadSettings();
        const loadedSession = loadCurrentSession();

        setKantinList(loadedKantin);
        setIuranRecords(loadedRecords);
        setPengeluaranList(loadedPengeluaran);
        setPemasukanLainList(loadedPemasukanLain);
        setSettings(loadedSettings);

        if (loadedSession && !currentUser) {
          setCurrentUser(loadedSession);
        }

        const now = new Date();
        setLastSyncedTime(now);

        if (source === 'online') {
          triggerNotification(
            'online',
            `Koneksi kembali aktif! Data iuran (${loadedKantin.length} stan kantin, ${loadedRecords.length} catatan transaksi) otomatis disinkronkan.`
          );
        } else if (source === 'manual') {
          triggerNotification(
            'synced',
            `Penyegaran data berhasil! (${loadedKantin.length} Stan Kantin, ${loadedRecords.length} Catatan Iuran, ${loadedPengeluaran.length} Pengeluaran, ${loadedPemasukanLain.length} Dana Luar).`
          );
        }
      } catch (err) {
        console.error('Auto-refresh error:', err);
      } finally {
        setTimeout(() => {
          setIsSyncing(false);
        }, 350);
      }
    },
    [currentUser, triggerNotification]
  );

  // Initial Load & URL Parameter check for ?kantinId=xxx
  useEffect(() => {
    refreshAllData('initial');

    const loadedKantin = loadKantinMaster();
    // If logged in as kantin role, automatically switch to portal mode for that canteen
    const activeSession = loadCurrentSession();
    if (activeSession && activeSession.role === 'kantin' && activeSession.kantinId) {
      const foundKantin = loadedKantin.find((k) => k.id === activeSession.kantinId);
      if (foundKantin) {
        setPortalKantinTarget(foundKantin);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlKantinId = urlParams.get('kantinId');
    const isPortalParam = urlParams.get('portal') === 'true' || urlParams.get('app') === 'kantin';

    if (urlKantinId && loadedKantin.length > 0) {
      const found = loadedKantin.find((k) => k.id === urlKantinId);
      if (found) {
        setPortalKantinTarget(found);
        setIsDirectLink(true);
      }
    } else if (isPortalParam && loadedKantin.length > 0) {
      setPortalKantinTarget(loadedKantin[0]);
    }
  }, [refreshAllData]);

  // Lifecycle listeners: Online/Offline, Window Focus, Visibility Change, Cross-Tab Storage
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoRefreshOnReturn) {
        refreshAllData('online');
      } else {
        triggerNotification('online', 'Koneksi internet kembali aktif.');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      triggerNotification(
        'offline',
        'Aplikasi beralih ke Mode Offline. Anda tetap dapat melakukan pencatatan iuran & data disimpan lokal di perangkat ini.'
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && autoRefreshOnReturn) {
        refreshAllData('focus');
      }
    };

    const handleWindowFocus = () => {
      if (autoRefreshOnReturn) {
        refreshAllData('focus');
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('kantin_sekolah_') || e.key.startsWith('kantin_auth_'))) {
        refreshAllData('storage');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('storage', handleStorageChange);

    // Periodic Heartbeat Auto-Sync
    let intervalId: NodeJS.Timeout | null = null;
    if (periodicSyncEnabled) {
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshAllData('periodic');
        }
      }, 30000); // every 30s
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('storage', handleStorageChange);
      if (intervalId) clearInterval(intervalId);
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, [autoRefreshOnReturn, periodicSyncEnabled, refreshAllData, triggerNotification]);

  // Apply Screen Orientation Lock according to settings
  useEffect(() => {
    const orientationSetting = settings.screenOrientation || 'auto';
    if (typeof window !== 'undefined' && screen.orientation) {
      const so = screen.orientation as any;
      if (typeof so.lock === 'function') {
        if (orientationSetting === 'portrait') {
          so.lock('portrait').catch(() => {});
        } else if (orientationSetting === 'landscape') {
          so.lock('landscape').catch(() => {});
        } else {
          try {
            so.unlock();
          } catch (e) {}
        }
      }
    }
  }, [settings.screenOrientation]);

  const handleToggleAutoRefreshOnReturn = (val: boolean) => {
    setAutoRefreshOnReturn(val);
    try {
      localStorage.setItem('kantin_auto_refresh_on_return', val ? 'true' : 'false');
    } catch {}
  };

  const handleTogglePeriodicSync = (val: boolean) => {
    setPeriodicSyncEnabled(val);
    try {
      localStorage.setItem('kantin_periodic_sync', val ? 'true' : 'false');
    } catch {}
  };

  const handleLoginSuccess = (
    user: UserAccount,
    newSettings?: SchoolSettings,
    newKantinList?: Kantin[],
    newIuranRecords?: IuranHarian[],
    newPengeluaranList?: Pengeluaran[]
  ) => {
    setCurrentUser(user);
    if (newSettings) {
      setSettings(newSettings);
    }
    if (newKantinList !== undefined) {
      setKantinList(newKantinList);
    }
    if (newIuranRecords !== undefined) {
      setIuranRecords(newIuranRecords);
    }
    if (newPengeluaranList !== undefined) {
      setPengeluaranList(newPengeluaranList);
    }

    if (user.role === 'kantin' && user.kantinId) {
      const list = newKantinList !== undefined ? newKantinList : kantinList;
      const found = list.find((k) => k.id === user.kantinId);
      if (found) {
        setPortalKantinTarget(found);
      }
    } else {
      setPortalKantinTarget(null);
    }
  };

  const handleLogout = () => {
    clearCurrentSession();
    setCurrentUser(null);
    setPortalKantinTarget(null);
  };

  const handleResetToCleanData = () => {
    const clean = resetToCleanData();
    setKantinList(clean.kantin);
    setIuranRecords(clean.iuran);
    setPengeluaranList(clean.pengeluaran);
    setPemasukanLainList(clean.pemasukanLain);
  };

  // Handlers for Kantin Master
  const handleAddKantin = (newKantin: Kantin) => {
    const updated = [newKantin, ...kantinList];
    setKantinList(updated);
    saveKantinMaster(updated);
  };

  const handleUpdateKantin = (updatedKantin: Kantin) => {
    const updated = kantinList.map((k) => (k.id === updatedKantin.id ? updatedKantin : k));
    setKantinList(updated);
    saveKantinMaster(updated);
  };

  const handleDeleteKantin = (kantinId: string) => {
    const updated = kantinList.filter((k) => k.id !== kantinId);
    setKantinList(updated);
    saveKantinMaster(updated);
  };

  // Handlers for Pengeluaran
  const handleAddPengeluaran = (newPengeluaran: Pengeluaran) => {
    const updated = [newPengeluaran, ...pengeluaranList];
    setPengeluaranList(updated);
    savePengeluaran(updated);
  };

  const handleUpdatePengeluaran = (updatedPengeluaran: Pengeluaran) => {
    const updated = pengeluaranList.map((p) => (p.id === updatedPengeluaran.id ? updatedPengeluaran : p));
    setPengeluaranList(updated);
    savePengeluaran(updated);
  };

  const handleDeletePengeluaran = (id: string) => {
    const updated = pengeluaranList.filter((p) => p.id !== id);
    setPengeluaranList(updated);
    savePengeluaran(updated);
  };

  // Handlers for Pemasukan Lain (Dana dari Luar Iuran)
  const handleAddPemasukanLain = (newPemasukan: PemasukanLain) => {
    const updated = [newPemasukan, ...pemasukanLainList];
    setPemasukanLainList(updated);
    savePemasukanLain(updated);
  };

  const handleUpdatePemasukanLain = (updatedPemasukan: PemasukanLain) => {
    const updated = pemasukanLainList.map((item) => (item.id === updatedPemasukan.id ? updatedPemasukan : item));
    setPemasukanLainList(updated);
    savePemasukanLain(updated);
  };

  const handleDeletePemasukanLain = (id: string) => {
    const updated = pemasukanLainList.filter((item) => item.id !== id);
    setPemasukanLainList(updated);
    savePemasukanLain(updated);
  };

  // Handlers for Daily Records
  const handleUpdateRecord = (record: IuranHarian) => {
    const existingIndex = iuranRecords.findIndex(
      (r) => r.kantinId === record.kantinId && r.tanggal === record.tanggal
    );

    let updated: IuranHarian[];
    if (existingIndex >= 0) {
      updated = [...iuranRecords];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...iuranRecords];
    }

    setIuranRecords(updated);
    saveIuranRecords(updated);
  };

  const handleBatchMarkAllPaid = (tanggal: string) => {
    const activeKantin = kantinList.filter((k) => k.status === 'Aktif');
    let updated = [...iuranRecords];

    activeKantin.forEach((kantin) => {
      const idx = updated.findIndex((r) => r.kantinId === kantin.id && r.tanggal === tanggal);
      const newRec: IuranHarian = {
        id: idx >= 0 ? updated[idx].id : `iuran-${tanggal}-${kantin.id}`,
        kantinId: kantin.id,
        tanggal,
        nominalDibayar: kantin.nominalIuran,
        statusBayar: 'Lunas',
        metodePembayaran: idx >= 0 && updated[idx].metodePembayaran !== '-' ? updated[idx].metodePembayaran : 'Tunai',
        catatan: idx >= 0 ? updated[idx].catatan : '',
        createdAt: idx >= 0 ? updated[idx].createdAt : new Date().toISOString(),
      };

      if (idx >= 0) {
        updated[idx] = newRec;
      } else {
        updated.push(newRec);
      }
    });

    setIuranRecords(updated);
    saveIuranRecords(updated);
  };

  // Handlers for Settings
  const handleSaveSettings = (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Unpaid count today for header badge
  const todayIso = getTodayIsoString();
  const activeKantin = kantinList.filter((k) => k.status === 'Aktif');
  const todayRecords = iuranRecords.filter((r) => r.tanggal === todayIso);
  const countLunasToday = todayRecords.filter((r) => r.statusBayar === 'Lunas').length;
  const unpaidCountToday = Math.max(0, activeKantin.length - countLunasToday);

  const handleExitPortalMode = () => {
    setPortalKantinTarget(null);
    setIsDirectLink(false);
    // Remove query param from browser URL cleanly without reload
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  };

  // Login guard: If no user is logged in AND not viewing Canteen Owner Portal, show Login for Bendahara
  if (!currentUser && !portalKantinTarget) {
    return (
      <LoginView
        settings={settings}
        kantinList={kantinList}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      
      {/* Sync / Offline Banner Notification */}
      <SyncNotificationBanner
        notification={syncNotification}
        onDismiss={() => setSyncNotification(null)}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onManualRefresh={() => refreshAllData('manual')}
      />

      {/* Header */}
      <Header
        settings={settings}
        currentUser={currentUser}
        onLogout={handleLogout}
        onGoToLogin={handleExitPortalMode}
        onOpenQris={() => setIsQrisOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        unpaidCountToday={unpaidCountToday}
        activePortalKantin={portalKantinTarget}
        isDirectLink={isDirectLink}
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastSyncedTime={lastSyncedTime}
        onManualRefresh={() => refreshAllData('manual')}
      />

      {/* Navigation (Hidden if in Canteen Owner Portal view) */}
      {!portalKantinTarget && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unpaidCountToday={unpaidCountToday}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* If Canteen Owner Portal active */}
        {portalKantinTarget ? (
          <CanteenOwnerPortalView
            kantinList={kantinList}
            selectedKantin={portalKantinTarget}
            iuranRecords={iuranRecords}
            settings={settings}
            onSelectKantin={(kantin) => setPortalKantinTarget(kantin)}
            onExitPortal={handleExitPortalMode}
            isDirectLink={isDirectLink}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                kantinList={kantinList}
                iuranRecords={iuranRecords}
                pengeluaranList={pengeluaranList}
                pemasukanLainList={pemasukanLainList}
                settings={settings}
                currentUser={currentUser}
                setActiveTab={setActiveTab}
                onOpenWaReminder={(kantin) => setWaModalTarget({ kantin })}
              />
            )}

            {activeTab === 'input' && (
              <DailyInputView
                kantinList={kantinList}
                iuranRecords={iuranRecords}
                settings={settings}
                onUpdateRecord={handleUpdateRecord}
                onBatchMarkAllPaid={handleBatchMarkAllPaid}
                onOpenWaReminder={(kantin, customTanggal) =>
                  setWaModalTarget({ kantin, customTanggal })
                }
                onOpenOwnerPortal={(kantin) => setPortalKantinTarget(kantin)}
              />
            )}

            {activeTab === 'pengeluaran' && (
              <PengeluaranView
                pengeluaranList={pengeluaranList}
                settings={settings}
                onAddPengeluaran={handleAddPengeluaran}
                onUpdatePengeluaran={handleUpdatePengeluaran}
                onDeletePengeluaran={handleDeletePengeluaran}
                onUpdateSettings={handleSaveSettings}
              />
            )}

            {activeTab === 'pemasukan-lain' && (
              <PemasukanLainView
                pemasukanList={pemasukanLainList}
                pemasukanLainList={pemasukanLainList}
                settings={settings}
                onAddPemasukan={handleAddPemasukanLain}
                onAddPemasukanLain={handleAddPemasukanLain}
                onUpdatePemasukan={handleUpdatePemasukanLain}
                onUpdatePemasukanLain={handleUpdatePemasukanLain}
                onDeletePemasukan={handleDeletePemasukanLain}
                onDeletePemasukanLain={handleDeletePemasukanLain}
              />
            )}

            {activeTab === 'kantin' && (
              <KantinMasterView
                kantinList={kantinList}
                settings={settings}
                onAddKantin={handleAddKantin}
                onUpdateKantin={handleUpdateKantin}
                onDeleteKantin={handleDeleteKantin}
              />
            )}

            {(activeTab === 'reports' || activeTab === 'daily' || activeTab === 'monthly') && (
              <ReportsCombinedView
                kantinList={kantinList}
                iuranRecords={iuranRecords}
                pengeluaranList={pengeluaranList}
                pemasukanLainList={pemasukanLainList}
                settings={settings}
                onOpenWaReminder={(kantin, customTanggal) =>
                  setWaModalTarget({ kantin, customTanggal })
                }
                defaultSubTab={activeTab === 'monthly' ? 'monthly' : 'daily'}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                currentUser={currentUser}
                kantinCount={kantinList.length}
                iuranCount={iuranRecords.length}
                pengeluaranCount={pengeluaranList.length}
                pemasukanLainCount={pemasukanLainList.length}
                isOnline={isOnline}
                isSyncing={isSyncing}
                lastSyncedTime={lastSyncedTime}
                autoRefreshOnReturn={autoRefreshOnReturn}
                onToggleAutoRefreshOnReturn={handleToggleAutoRefreshOnReturn}
                periodicSyncEnabled={periodicSyncEnabled}
                onTogglePeriodicSync={handleTogglePeriodicSync}
                onManualRefresh={() => refreshAllData('manual')}
                onSaveSettings={handleSaveSettings}
                onResetToCleanData={handleResetToCleanData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {settings.namaSekolah || 'Pengelola Kantin Terpadu'} •{' '}
            {portalKantinTarget
              ? `Aplikasi Portal Stand ${portalKantinTarget.namaKantin}`
              : 'Bendahara Utama Kantin Sekolah'}
          </span>
          <span className="text-slate-400">
            Sistem Manajemen & Penagihan Iuran Kantin
          </span>
        </div>
      </footer>

      {/* Modals */}
      {isQrisOpen && (
        <QrisModal
          settings={settings}
          onClose={() => setIsQrisOpen(false)}
        />
      )}

      {isInstallModalOpen && (
        <InstallPwaModal
          onClose={() => setIsInstallModalOpen(false)}
        />
      )}

      {waModalTarget && (
        <WaTemplateModal
          kantin={waModalTarget.kantin}
          customTanggal={waModalTarget.customTanggal}
          iuranRecords={iuranRecords}
          settings={settings}
          onClose={() => setWaModalTarget(null)}
        />
      )}

    </div>
  );
}


