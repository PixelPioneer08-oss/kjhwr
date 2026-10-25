import React, { useState, useEffect } from 'react';
import { 
  fetchMetadata, 
  fetchAnalysis, 
  fetchHorizonCurve, 
  AnalysisParams 
} from './api';
import { 
  AnalysisResponse, 
  HorizonResponse, 
  MetadataResponse 
} from './types';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { KpiGrid } from './components/KpiGrid';
import { DeliveryDayChart } from './components/DeliveryDayChart';
import { LeadTimeCurve } from './components/LeadTimeCurve';
import { DiurnalChart } from './components/DiurnalChart';
import { DailyTrendChart } from './components/DailyTrendChart';
import { WhatIfTool } from './components/WhatIfTool';
import { MethodologyModal } from './components/MethodologyModal';
import { 
  Activity, 
  TrendingDown, 
  Clock, 
  CalendarDays, 
  Calculator, 
  AlertOctagon,
  RefreshCw
} from 'lucide-react';

export const App: React.FC = () => {
  const [params, setParams] = useState<AnalysisParams>({
    decision_from: '2026-01-01',
    decision_to: '2026-01-31',
    mode: 'gate',
    cutoff: '09:20',
    horizon_hours: 24,
    selected_delivery_day: '2026-01-02',
  });

  const [activeTab, setActiveTab] = useState<'day_deepdive' | 'lead_time' | 'diurnal' | 'daily' | 'what_if'>('day_deepdive');
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [horizon, setHorizon] = useState<HorizonResponse | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHorizonLoading, setIsHorizonLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  // Load metadata once
  useEffect(() => {
    fetchMetadata()
      .then((data) => setMetadata(data))
      .catch((err) => console.warn('Could not load metadata:', err));
  }, []);

  // Fetch analysis data
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    fetchAnalysis(params)
      .then((data) => {
        if (!isCancelled) {
          setAnalysis(data);
          // If current selected day not in available days, update it
          if (!data.delivery_days.includes(params.selected_delivery_day || '')) {
            setParams((prev) => ({
              ...prev,
              selected_delivery_day: data.delivery_days[0] || '2026-01-02',
            }));
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) setError(err.message);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    params.decision_from,
    params.decision_to,
    params.mode,
    params.cutoff,
    params.horizon_hours,
    params.selected_delivery_day,
  ]);

  // Fetch horizon curve
  useEffect(() => {
    let isCancelled = false;
    setIsHorizonLoading(true);

    fetchHorizonCurve(params.decision_from || '2026-01-01', params.decision_to || '2026-01-31', 48)
      .then((data) => {
        if (!isCancelled) setHorizon(data);
      })
      .catch((err) => console.warn('Horizon fetch failed:', err))
      .finally(() => {
        if (!isCancelled) setIsHorizonLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [params.decision_from, params.decision_to]);

  const handleParamsChange = (updated: Partial<AnalysisParams>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  const handleSelectDay = (day: string) => {
    setParams((prev) => ({ ...prev, selected_delivery_day: day }));
    // Switch to deepdive tab so user immediately sees the selected day
    setActiveTab('day_deepdive');
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-sans">
      {/* Header */}
      <Header metadata={metadata} onOpenMethodology={() => setIsMethodologyOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Controls */}
        <Controls 
          params={params} 
          onChange={handleParamsChange} 
          isLoading={isLoading} 
        />

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Analysis Query Failed</strong>
              <p className="text-xs text-rose-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !analysis && (
          <div className="h-64 flex flex-col items-center justify-center gap-3 card">
            <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
            <p className="text-sm text-text-secondary">
              Evaluating Elexon BMRS day-ahead wind forecast records...
            </p>
          </div>
        )}

        {/* Main Dashboard Content */}
        {analysis && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards Grid */}
            <KpiGrid summary={analysis.summary} />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border-subtle pb-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('day_deepdive')}
                className={`btn text-xs py-2 px-3.5 ${
                  activeTab === 'day_deepdive' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Delivery Day Profile ({analysis.selected_day_data.date})</span>
              </button>

              <button
                onClick={() => setActiveTab('what_if')}
                className={`btn text-xs py-2 px-3.5 ${
                  activeTab === 'what_if' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>What-If Procurement Tool</span>
              </button>

              <button
                onClick={() => setActiveTab('lead_time')}
                className={`btn text-xs py-2 px-3.5 ${
                  activeTab === 'lead_time' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Lead-Time Curve (1h – 48h)</span>
              </button>

              <button
                onClick={() => setActiveTab('diurnal')}
                className={`btn text-xs py-2 px-3.5 ${
                  activeTab === 'diurnal' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Diurnal Error Profile (0..23h)</span>
              </button>

              <button
                onClick={() => setActiveTab('daily')}
                className={`btn text-xs py-2 px-3.5 ${
                  activeTab === 'daily' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Daily Month Trend</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'day_deepdive' && (
              <div className="space-y-6 animate-fade-in">
                <DeliveryDayChart
                  dayData={analysis.selected_day_data}
                  availableDays={analysis.delivery_days}
                  selectedDay={params.selected_delivery_day || analysis.delivery_days[0]}
                  onSelectDay={handleSelectDay}
                  cutoff={params.cutoff || '09:20'}
                />

                {/* Embedded What-If Calculator right below deep-dive */}
                <WhatIfTool 
                  summary={analysis.summary} 
                  dayData={analysis.selected_day_data} 
                />
              </div>
            )}

            {activeTab === 'what_if' && (
              <div className="animate-fade-in space-y-6">
                <WhatIfTool 
                  summary={analysis.summary} 
                  dayData={analysis.selected_day_data} 
                />
                <DeliveryDayChart
                  dayData={analysis.selected_day_data}
                  availableDays={analysis.delivery_days}
                  selectedDay={params.selected_delivery_day || analysis.delivery_days[0]}
                  onSelectDay={handleSelectDay}
                  cutoff={params.cutoff || '09:20'}
                />
              </div>
            )}

            {activeTab === 'lead_time' && (
              <div className="animate-fade-in">
                <LeadTimeCurve
                  curveData={horizon?.curve || []}
                  currentLeadTime={analysis.summary.mean_lead_time_hours}
                  isLoading={isHorizonLoading}
                />
              </div>
            )}

            {activeTab === 'diurnal' && (
              <div className="animate-fade-in">
                <DiurnalChart hourlyMetrics={analysis.hourly_metrics} />
              </div>
            )}

            {activeTab === 'daily' && (
              <div className="animate-fade-in space-y-6">
                <DailyTrendChart
                  dailyMetrics={analysis.daily_metrics}
                  onSelectDay={handleSelectDay}
                  selectedDay={params.selected_delivery_day || analysis.delivery_days[0]}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-bg-surface/50 text-xs text-text-muted py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-text-secondary font-medium">
              GB Wind Day-Ahead Procurement Pilot • UK Wholesale Electricity Market Analytics
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Built with real Elexon BMRS API streams (FUELHH & WINDFOR). No demand or price data assumed.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="text-cyan-400 hover:underline"
            >
              Market Methodology
            </button>
            <span>•</span>
            <span className="font-mono text-text-muted">Jan 2026 Benchmark</span>
          </div>
        </div>
      </footer>

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};
export default App;
