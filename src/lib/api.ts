import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
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

export interface PublicService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  color: string;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: number;
  total: number;
}

export interface BookingDto {
  staffId: string;
  serviceId: string;
  date: string;
  startTime: string;
  firstName: string;
  lastName: string;
  dni?: string;
  phone: string;
  email?: string;
  notes?: string;
}

export function formatSchedule(schedule: StaffScheduleSlot[]): string {
  if (!schedule.length) return 'Sin horario registrado';
  const today = new Date().toISOString().split('T')[0];
  const upcoming = schedule.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  if (!upcoming.length) return 'Sin próximos horarios';
  const next = upcoming[0];
  const d = new Date(next.date + 'T12:00:00');
  const label = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  return `Próx. ${label} · ${next.startTime} – ${next.endTime}`;
}

export function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`;
}

export async function fetchStaff(): Promise<PublicStaff[]> {
  const { data } = await client.get('/public/staff', { params: { tenantId: TENANT_ID } });
  return data.data ?? [];
}

export async function fetchStaffServices(staffId: string): Promise<PublicService[]> {
  const { data } = await client.get('/public/services', { params: { tenantId: TENANT_ID, staffId } });
  return data.data ?? [];
}

export async function fetchAvailability(staffId: string, serviceId: string, date: string): Promise<AvailabilitySlot[]> {
  const { data } = await client.get('/public/availability', {
    params: { tenantId: TENANT_ID, staffId, serviceId, date },
  });
  return data.data ?? [];
}

export async function createBooking(dto: BookingDto) {
  const { data } = await client.post('/public/appointments', { ...dto, tenantId: TENANT_ID });
  return data.data;
}
