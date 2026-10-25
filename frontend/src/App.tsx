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

type TabId = 'day_deepdive' | 'lead_time' | 'diurnal' | 'daily' | 'what_if';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'day_deepdive', label: 'Delivery Day Profile', icon: Activity },
  { id: 'what_if', label: 'What-If Procurement', icon: Calculator },
  { id: 'lead_time', label: 'Lead-Time Curve (1–48h)', icon: TrendingDown },
  { id: 'diurnal', label: 'Diurnal Error Profile', icon: Clock },
  { id: 'daily', label: 'Daily Month Trend', icon: CalendarDays },
];

export const App: React.FC = () => {
  const [params, setParams] = useState<AnalysisParams>({
    decision_from: '2026-01-01',
    decision_to: '2026-01-31',
    mode: 'gate',
    cutoff: '09:20',
    horizon_hours: 24,
    selected_delivery_day: '2026-01-02',
  });

  const [activeTab, setActiveTab] = useState<TabId>('day_deepdive');
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [horizon, setHorizon] = useState<HorizonResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHorizonLoading, setIsHorizonLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchMetadata()
      .then((data) => setMetadata(data))
      .catch((err) => console.warn('Could not load metadata:', err));
  }, []);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    fetchAnalysis(params)
      .then((data) => {
        if (!isCancelled) {
          setAnalysis(data);
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

    return () => { isCancelled = true; };
  }, [
    params.decision_from,
    params.decision_to,
    params.mode,
    params.cutoff,
    params.horizon_hours,
    params.selected_delivery_day,
  ]);

  useEffect(() => {
    let isCancelled = false;
    setIsHorizonLoading(true);

    fetchHorizonCurve(params.decision_from || '2026-01-01', params.decision_to || '2026-01-31', 48)
      .then((data) => { if (!isCancelled) setHorizon(data); })
      .catch((err) => console.warn('Horizon fetch failed:', err))
      .finally(() => { if (!isCancelled) setIsHorizonLoading(false); });

    return () => { isCancelled = true; };
  }, [params.decision_from, params.decision_to]);

  const handleParamsChange = (updated: Partial<AnalysisParams>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  const handleSelectDay = (day: string) => {
    setParams((prev) => ({ ...prev, selected_delivery_day: day }));
    setActiveTab('day_deepdive');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)' }}>
      <Header metadata={metadata} onOpenMethodology={() => setIsMethodologyOpen(true)} />

      <main style={{
        flex: 1,
        maxWidth: 1280, width: '100%', margin: '0 auto',
        padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <Controls params={params} onChange={handleParamsChange} />

        {/* Error Banner */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.45)',
            color: '#fda4af', fontSize: 13,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <AlertOctagon size={18} color="#f43f5e" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong style={{ display: 'block', fontWeight: 600 }}>Analysis Query Failed</strong>
              <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 2 }}>{error}</p>
            </div>
          </div>
        )}

        {/* Initial Loading State */}
        {isLoading && !analysis && (
          <div className="card" style={{
            height: 240,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <RefreshCw size={28} color="var(--cyan)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Evaluating Elexon BMRS day-ahead wind forecast records…
            </p>
          </div>
        )}

        {/* Main Dashboard */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-in">

            <KpiGrid summary={analysis.summary} />

            {/* Tab Nav */}
            <div style={{
              display: 'flex', gap: 4, overflowX: 'auto',
              borderBottom: '1px solid var(--border)', paddingBottom: 1,
            }}>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const label = tab.id === 'day_deepdive'
                  ? `Delivery Day Profile (${analysis.selected_day_data.date})`
                  : tab.label;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: '8px 8px 0 0',
                      border: '1px solid transparent',
                      borderBottom: isActive ? '1px solid var(--bg-surface)' : '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: 12, fontWeight: isActive ? 600 : 400,
                      fontFamily: 'var(--font)', whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.1))'
                        : 'transparent',
                      color: isActive ? '#67e8f9' : 'var(--text-secondary)',
                      borderColor: isActive ? 'rgba(6,182,212,0.35)' : 'transparent',
                      marginBottom: isActive ? -1 : 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon size={13} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            {activeTab === 'day_deepdive' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-in">
                <DeliveryDayChart
                  dayData={analysis.selected_day_data}
                  availableDays={analysis.delivery_days}
                  selectedDay={params.selected_delivery_day || analysis.delivery_days[0]}
                  onSelectDay={handleSelectDay}
                  cutoff={params.cutoff || '09:20'}
                />
                <WhatIfTool summary={analysis.summary} dayData={analysis.selected_day_data} />
              </div>
            )}

            {activeTab === 'what_if' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-in">
                <WhatIfTool summary={analysis.summary} dayData={analysis.selected_day_data} />
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
              <div className="animate-in">
                <LeadTimeCurve
                  curveData={horizon?.curve || []}
                  currentLeadTime={analysis.summary.mean_lead_time_hours}
                  isLoading={isHorizonLoading}
                />
              </div>
            )}

            {activeTab === 'diurnal' && (
              <div className="animate-in">
                <DiurnalChart hourlyMetrics={analysis.hourly_metrics} />
              </div>
            )}

            {activeTab === 'daily' && (
              <div className="animate-in">
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
      <footer style={{
        borderTop: '1px solid var(--border)',
        background: 'rgba(13,17,23,0.6)',
        padding: '20px 24px',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 2 }}>
              GB Wind Day-Ahead Procurement Pilot · UK Wholesale Electricity Market Analytics
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Built with real Elexon BMRS API streams (FUELHH &amp; WINDFOR). No demand or price data assumed.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setIsMethodologyOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--cyan)', fontSize: 11, fontFamily: 'var(--font)',
              }}
            >
              Market Methodology
            </button>
            <span>•</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>Jan 2026 Benchmark</span>
          </div>
        </div>
      </footer>

      <MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
    </div>
  );
};

export default App;
