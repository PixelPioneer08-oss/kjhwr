export interface ErrorPercentiles {
  p05: number;
  p10: number;
  p50: number;
  p90: number;
  p95: number;
}

export interface SummaryMetrics {
  n: number;
  mae: number;
  rmse: number;
  bias: number;
  wape: number;
  mape: number;
  share_overforecast: number;
  error_percentiles: ErrorPercentiles;
  mean_lead_time_hours: number;
  total_overforecast_mwh: number;
  total_actual_mwh: number;
  total_forecast_mwh: number;
  buffer_p90: number;
  buffer_p95: number;
  mean_actual: number;
  mean_forecast: number;
}

export interface DailyMetric {
  date: string;
  n: number;
  mae: number;
  rmse: number;
  bias: number;
  wape: number;
  mape: number;
  buffer_p90: number;
  total_overforecast_mwh: number;
  mean_actual: number;
  mean_forecast: number;
}

export interface HourlyMetric {
  hour: number;
  n: number;
  mae: number;
  rmse: number;
  bias: number;
  buffer_p90: number;
  mean_actual: number;
  mean_forecast: number;
}

export interface DayPoint {
  startTime: string;
  publishTime: string;
  actual: number;
  forecast: number;
  error: number;
  lead_time_hours: number;
  hour: number;
}

export interface SelectedDayData {
  date: string;
  summary: SummaryMetrics;
  series: DayPoint[];
}

export interface AnalysisResponse {
  status: string;
  parameters: {
    mode: 'gate' | 'horizon';
    cutoff: string;
    horizon_hours: number;
    decision_from?: string;
    decision_to?: string;
    delivery_from?: string;
    delivery_to?: string;
    selected_delivery_day: string;
  };
  summary: SummaryMetrics;
  daily_metrics: DailyMetric[];
  hourly_metrics: HourlyMetric[];
  delivery_days: string[];
  selected_day_data: SelectedDayData;
}

export interface HorizonPoint {
  horizon_hours: number;
  n: number;
  mae: number;
  rmse: number;
  bias: number;
  p90: number;
  buffer_p90: number;
}

export interface HorizonResponse {
  status: string;
  max_horizon: number;
  curve: HorizonPoint[];
}

export interface MetadataResponse {
  actuals_resolution_minutes: number;
  forecasts_resolution_minutes: number;
  observed_publish_times_utc: string[];
  total_actuals_rows: number;
  total_forecasts_rows: number;
  actuals_start_time_min?: string;
  actuals_start_time_max?: string;
  forecasts_publish_min?: string;
  forecasts_publish_max?: string;
  fetched_at_utc?: string;
  is_synthetic: boolean;
  data_sources?: {
    actuals: string;
    forecasts: string;
  };
  gate_closures_info?: Record<string, string>;
  error_convention?: string;
}
