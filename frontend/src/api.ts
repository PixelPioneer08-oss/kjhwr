import { AnalysisResponse, HorizonResponse, MetadataResponse } from './types';

const API_BASE = '/api';

export async function fetchMetadata(): Promise<MetadataResponse> {
  const res = await fetch(`${API_BASE}/meta`);
  if (!res.ok) {
    throw new Error(`Failed to fetch metadata: ${res.statusText}`);
  }
  return res.json();
}

export interface AnalysisParams {
  decision_from?: string;
  decision_to?: string;
  delivery_from?: string;
  delivery_to?: string;
  mode?: 'gate' | 'horizon';
  cutoff?: string;
  horizon_hours?: number;
  selected_delivery_day?: string;
}

export async function fetchAnalysis(params: AnalysisParams): Promise<AnalysisResponse> {
  const query = new URLSearchParams();
  if (params.decision_from) query.set('decision_from', params.decision_from);
  if (params.decision_to) query.set('decision_to', params.decision_to);
  if (params.delivery_from) query.set('delivery_from', params.delivery_from);
  if (params.delivery_to) query.set('delivery_to', params.delivery_to);
  if (params.mode) query.set('mode', params.mode);
  if (params.cutoff) query.set('cutoff', params.cutoff);
  if (params.horizon_hours !== undefined) query.set('horizon_hours', params.horizon_hours.toString());
  if (params.selected_delivery_day) query.set('selected_delivery_day', params.selected_delivery_day);

  const res = await fetch(`${API_BASE}/analysis?${query.toString()}`);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.detail || `Analysis request failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchHorizonCurve(
  decision_from: string = '2026-01-01',
  decision_to: string = '2026-01-31',
  max_horizon: number = 48
): Promise<HorizonResponse> {
  const query = new URLSearchParams({
    decision_from,
    decision_to,
    max_horizon: max_horizon.toString(),
  });
  const res = await fetch(`${API_BASE}/horizon?${query.toString()}`);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.detail || `Horizon request failed with status ${res.status}`);
  }
  return res.json();
}
