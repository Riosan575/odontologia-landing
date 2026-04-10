import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '';

const client = axios.create({ baseURL: API_URL });

export interface StaffScheduleDay {
  dayOfWeek: number;   // 0=Sun … 6=Sat
  startTime: string;   // "09:00"
  endTime: string;     // "18:00"
  isWorking: boolean;  // backend field name from WorkingHoursEntity
}

export interface PublicStaff {
  id: string;
  fullName: string;
  specialization: string;
  bio: string;
  avatar: string;
  color: string;
  schedule: StaffScheduleDay[];
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function formatSchedule(schedule: StaffScheduleDay[]): string {
  const active = schedule.filter(d => d.isWorking);
  if (!active.length) return 'Sin horario';
  const days = active.map(d => DAY_NAMES[d.dayOfWeek]).join(', ');
  const first = active[0];
  return `${days} · ${first.startTime} – ${first.endTime}`;
}

export async function fetchStaff(): Promise<PublicStaff[]> {
  const { data } = await client.get('/public/staff', {
    params: { tenantId: TENANT_ID },
  });
  return data.data ?? [];
}

