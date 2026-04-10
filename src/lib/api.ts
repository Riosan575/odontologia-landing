import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '';

const client = axios.create({ baseURL: API_URL });

export interface StaffScheduleSlot {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface PublicStaff {
  id: string;
  fullName: string;
  specialization: string;
  bio: string;
  avatar: string;
  color: string;
  schedule: StaffScheduleSlot[];
}

export function formatSchedule(schedule: StaffScheduleSlot[]): string {
  if (!schedule.length) return 'Sin horario registrado';
  // Show next upcoming date
  const today = new Date().toISOString().split('T')[0];
  const upcoming = schedule.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  if (!upcoming.length) return 'Sin próximos horarios';
  const next = upcoming[0];
  const d = new Date(next.date + 'T12:00:00');
  const label = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  return `Próx. ${label} · ${next.startTime} – ${next.endTime}`;
}

export async function fetchStaff(): Promise<PublicStaff[]> {
  const { data } = await client.get('/public/staff', {
    params: { tenantId: TENANT_ID },
  });
  return data.data ?? [];
}
