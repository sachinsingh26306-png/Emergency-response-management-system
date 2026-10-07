const API_URL = 'http://localhost:8080/api';

export interface Emergency {
  id: number;
  type: string;
  description: string;
  location: string;
  locationName: string;
  locationCoords?: [number, number];
  gridX: number;
  gridY: number;
  gridPos?: [number, number];
  severity: number;
  peopleAffected: number;
  status: string;
  priority: number;
  priorityScore: number;
  timestamp: string;
  assignedUnitId: number;
  traffic?: string;
  urgency?: string;
  summary?: string;
}

export interface ResponseUnit {
  id: number;
  type: string;
  status: string;
  available: boolean;
  gridX: number;
  gridY: number;
  gridPos?: [number, number];
  location?: [number, number];
  assignedEmergency: string;
  assignedEmergencyId: number;
}

export interface SummaryStatistics {
  totalEmergencies: number;
  reported: number;
  dispatched: number;
  resolved: number;
  waiting: number;
  availableUnits: number;
  busyUnits: number;
  activeEmergencies: number;
}

export interface DashboardState {
  emergencies: Emergency[];
  priorityQueue: Emergency[];
  triageQueue?: Emergency[];
  units: ResponseUnit[];
  grid: string[][];
  recentActions: string[];
  eventLog?: string[];
  actionHistory: string[];
  summaryStatistics?: SummaryStatistics;
  dsa?: Record<string, number>;
}

export const fetchState = async (): Promise<DashboardState> => {
  const res = await fetch(`${API_URL}/state`);
  if (!res.ok) {
    throw new Error(`Server returned HTTP ${res.status}`);
  }
  return res.json();
};

export const reportEmergencyManual = async (payload: {
  type: string;
  description: string;
  locationName: string;
  gridX: number;
  gridY: number;
  severity: number;
  peopleAffected: number;
}): Promise<{ success: boolean; emergency: Emergency }> => {
  const res = await fetch(`${API_URL}/emergencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
};

export const reportEmergencyAI = async (
  description: string
): Promise<{ success: boolean; aiAnalysis?: any; error?: string; errorType?: string }> => {
  const res = await fetch(`${API_URL}/emergencies/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || `HTTP ${res.status}`, errorType: data.errorType };
  }
  return data;
};

export const dispatchNext = async (): Promise<{
  success: boolean;
  dispatchedEmergency?: Emergency;
  assignedUnit?: ResponseUnit;
  distance?: number;
  error?: string;
}> => {
  const res = await fetch(`${API_URL}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
};

export const simulateStep = async (): Promise<{
  success: boolean;
  movedCount: number;
  units: ResponseUnit[];
  grid: string[][];
}> => {
  const res = await fetch(`${API_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
};

export const resolveEmergency = async (
  id: number
): Promise<{
  success: boolean;
  resolvedEmergency?: Emergency;
  assignedUnit?: ResponseUnit;
  error?: string;
}> => {
  const res = await fetch(`${API_URL}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
};

