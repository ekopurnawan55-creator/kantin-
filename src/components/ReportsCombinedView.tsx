import React, { useState, useEffect } from 'react';
import { Kantin, IuranHarian, SchoolSettings, Pengeluaran, PemasukanLain } from '../types';
import { DailyReportView } from './DailyReportView';
import { MonthlyReportView } from './MonthlyReportView';
import { Calendar, FileSpreadsheet, FileText, BarChart3, TrendingUp, Layers } from 'lucide-react';

interface ReportsCombinedViewProps {
  kantinList: Kantin[];
  iuranRecords: IuranHarian[];
  pengeluaranList: Pengeluaran[];
  pemasukanLainList: PemasukanLain[];
  settings: SchoolSettings;
  onOpenWaReminder: (kantin: Kantin, customTanggal?: string) => void;
  defaultSubTab?: 'daily' | 'monthly';
}

export const ReportsCombinedView: React.FC<ReportsCombinedViewProps> = ({
  kantinList,
  iuranRecords,
  pengeluaranList,
  pemasukanLainList,
  settings,
  onOpenWaReminder,
  defaultSubTab = 'daily',
}) => {
  const [subTab, setSubTab] = useState<'daily' | 'monthly'>(defaultSubTab);

  // Sync if defaultSubTab prop changes externally
  useEffect(() => {
    if (defaultSubTab) {
      setSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  return (
    <div className="space-y-4">
      {/* Top Segmented Sub-Tab Switcher for Reports */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl hidden sm:flex">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Pusat Laporan & Rekap Keuangan</span>
            </h2>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Pilih mode tampilan rekapitulasi harian per tanggal atau laporan komprehensif bulanan & arus kas.
            </p>
          </div>
        </div>

        {/* Segmented Control Buttons */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubTab('daily')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'daily'
                ? 'bg-white text-blue-700 shadow-sm font-extrabold border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${subTab === 'daily' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Laporan Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('monthly')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'monthly'
                ? 'bg-white text-blue-700 shadow-sm font-extrabold border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${subTab === 'monthly' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Laporan Bulanan & Kas</span>
          </button>
        </div>
      </div>

      {/* Render Active Sub-Report */}
      {subTab === 'daily' ? (
        <DailyReportView
          kantinList={kantinList}
          iuranRecords={iuranRecords}
          pengeluaranList={pengeluaranList}
          settings={settings}
          onOpenWaReminder={onOpenWaReminder}
        />
      ) : (
        <MonthlyReportView
          kantinList={kantinList}
          iuranRecords={iuranRecords}
          pengeluaranList={pengeluaranList}
          pemasukanLainList={pemasukanLainList}
          settings={settings}
        />
      )}
    </div>
  );
};
