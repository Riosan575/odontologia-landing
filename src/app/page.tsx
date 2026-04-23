'use client';

import { useEffect, useState } from 'react';
import {
  Calendar, Clock, Phone, Star, CheckCircle,
  Loader2, Shield, Award, Smile, ChevronLeft, X, Check,
} from 'lucide-react';
import {
  fetchStaff, fetchStaffServices, fetchAvailability, createBooking,
  fmtTime,
  TENANT_ID,
  type PublicStaff, type PublicService, type AvailabilitySlot,
} from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}min` : h ? `${h}h` : `${m}min`;
}

function dateLabel(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ staff, size = 'md' }: { staff: PublicStaff; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-24 h-24 text-3xl' : size === 'md' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
  if (staff.avatar) return <img src={staff.avatar} alt={staff.fullName} className={`${dim} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: staff.color || '#1976D2' }}>
      {staff.fullName.charAt(0)}
    </div>
  );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
type Step = 'service' | 'date' | 'time' | 'form' | 'confirm';

interface BookingState {
  service: PublicService | null;
  date: string;
  slot: AvailabilitySlot | null;
  name: string;
  dni: string;
  phone: string;
  email: string;
  notes: string;
}

function BookingModal({ staff, onClose, initialDate }: { staff: PublicStaff; onClose: () => void; initialDate?: string }) {
  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<PublicService[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loadingSvc, setLoadingSvc] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [slotTaken, setSlotTaken] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Available dates from staff schedule (today onwards)
  const availableDates = [...new Set(staff.schedule.map(s => s.date))]
    .filter(d => d >= today).sort();

  const [booking, setBooking] = useState<BookingState>({
    service: null, date: initialDate || availableDates[0] || today,
    slot: null, name: '', dni: '', phone: '', email: '', notes: '',
  });

  useEffect(() => {
    fetchStaffServices(staff.id)
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoadingSvc(false));
  }, [staff.id]);

  // Re-fetch slots every time we enter the time step (including going back),
  // then keep polling every 15 s so stale slots disappear in real-time.
  useEffect(() => {
    if (step !== 'time' || !booking.service || !booking.date) return;

    let cancelled = false;

    const load = (showSpinner: boolean) => {
      if (showSpinner) setLoadingSlots(true);
      fetchAvailability(staff.id, booking.service!.id, booking.date)
        .then(slots => { if (!cancelled) setAvailability(slots); })
        .catch(() => { if (!cancelled) setAvailability([]); })
        .finally(() => { if (!cancelled && showSpinner) setLoadingSlots(false); });
    };

    load(true);
    const interval = setInterval(() => load(false), 15_000);
    return () => { cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, staff.id, booking.date, booking.service?.id]);

  const selectService = (svc: PublicService) => {
    setBooking(b => ({ ...b, service: svc, slot: null }));
    setStep(initialDate ? 'time' : 'date');
  };

  const selectDate = (date: string) => {
    setBooking(b => ({ ...b, date, slot: null }));
    setSlotTaken(false);
    setStep('time');
    // actual fetch is triggered by the useEffect above
  };

  const selectSlot = (slot: AvailabilitySlot) => {
    setBooking(b => ({ ...b, slot }));
    setSlotTaken(false);
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!booking.service || !booking.slot || !booking.name || !booking.phone) return;
    setSubmitting(true);
    setError('');
    try {
      await createBooking({
        staffId: staff.id,
        serviceId: booking.service.id,
        date: booking.date,
        startTime: booking.slot.startTime,
        customerName: booking.name,
        customerDni: booking.dni,
        customerPhone: booking.phone,
        customerEmail: booking.email || undefined,
        notes: booking.notes || undefined,
      });
      setDone(true);
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? '';
      const isConflict = e?.response?.status === 409 || msg.toLowerCase().includes('completo') || msg.toLowerCase().includes('conflict');
      if (isConflict) {
        // Slot was taken by someone else — go back to time picker and refresh
        setSlotTaken(true);
        setBooking(b => ({ ...b, slot: null }));
        setStep('time');
      } else {
        setError(msg || 'Error al reservar. Intente de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepBack: Record<Step, Step | null> = {
    service: null,
    date: 'service',
    time: initialDate ? 'service' : 'date',
    form: 'time',
    confirm: null,
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-md max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100 flex-shrink-0">
          {!done && stepBack[step] && (
            <button onClick={() => setStep(stepBack[step]!)} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
          )}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar staff={staff} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">{staff.fullName}</p>
              {staff.specialization && <p className="text-xs text-slate-500 truncate">{staff.specialization}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg flex-shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">

          {/* ── Done ── */}
          {done && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¡Reserva confirmada!</h3>
              <p className="text-slate-500 text-sm mb-6">
                Te esperamos el <span className="font-semibold text-slate-700 capitalize">{dateLabel(booking.date)}</span> a las{' '}
                <span className="font-semibold text-slate-700">{fmtTime(booking.slot!.startTime)}</span>.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
                <div className="flex justify-between"><span className="text-slate-500">Servicio</span><span className="font-medium text-slate-800">{booking.service?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Profesional</span><span className="font-medium text-slate-800">{staff.fullName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Duración</span><span className="font-medium text-slate-800">{fmtDuration(booking.service!.durationMinutes)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Precio</span><span className="font-medium text-slate-800">S/ {Number(booking.service!.price).toFixed(2)}</span></div>
              </div>
              <button onClick={onClose} className="w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors">
                Cerrar
              </button>
            </div>
          )}

          {/* ── Step: service ── */}
          {!done && step === 'service' && (
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">¿Qué servicio necesitas?</h3>
              {initialDate ? (
                <p className="text-sm text-teal-600 mb-4 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="capitalize">{dateLabel(initialDate)}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-500 mb-4">Selecciona el tratamiento</p>
              )}
              {loadingSvc ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
              ) : services.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Este profesional no tiene servicios disponibles</p>
              ) : (
                <div className="space-y-2">
                  {services.map(svc => (
                    <button key={svc.id} onClick={() => selectService(svc)}
                      className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-teal-300 hover:bg-teal-50/40 transition-all text-left group">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: svc.color || '#14b8a6' }} />
                        <div>
                          <p className="font-semibold text-slate-900 text-sm group-hover:text-teal-700">{svc.name}</p>
                          {svc.description && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{svc.description}</p>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-bold text-slate-900">S/ {Number(svc.price).toFixed(2)}</p>
                        <p className="text-xs text-slate-400">{fmtDuration(svc.durationMinutes)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step: date ── */}
          {!done && step === 'date' && (
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">¿Qué día prefieres?</h3>
              <p className="text-sm text-slate-500 mb-4">Días con disponibilidad</p>
              {availableDates.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin fechas disponibles próximamente</p>
              ) : (
                <div className="space-y-2">
                  {availableDates.map(d => {
                    const daySlots = staff.schedule.filter(s => s.date === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
                    const label = new Date(d + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
                    return (
                      <button key={d} onClick={() => selectDate(d)}
                        className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-teal-300 hover:bg-teal-50/40 transition-all text-left">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm capitalize">{label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {daySlots.map(s => `${fmtTime(s.startTime)}–${fmtTime(s.endTime)}`).join(' · ')}
                          </p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step: time ── */}
          {!done && step === 'time' && (
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Elige tu horario</h3>
              <p className="text-sm text-slate-500 mb-4 capitalize">{dateLabel(booking.date)}</p>
              {slotTaken && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs mb-4">
                  <span className="mt-0.5">⚠️</span>
                  <span>Ese horario ya fue reservado por otra persona. Por favor elige otro.</span>
                </div>
              )}
              {loadingSlots ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
              ) : availability.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No hay horarios disponibles para este día</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availability.map((slot, i) => {
                    const pct = slot.available / slot.total;
                    const urgency = pct <= 0.25 ? 'text-red-500' : pct <= 0.5 ? 'text-amber-500' : 'text-teal-600';
                    return (
                      <button key={i} onClick={() => selectSlot(slot)}
                        className="flex flex-col items-center p-3 border border-slate-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all">
                        <span className="font-bold text-slate-900 text-sm">{fmtTime(slot.startTime)}</span>
                        {slot.total > 1 && (
                          <span className={`text-xs mt-0.5 font-medium ${urgency}`}>
                            {slot.available === 1 ? 'Último lugar' : `${slot.available} lugares`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step: form ── */}
          {!done && step === 'form' && (
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Tus datos</h3>
              <p className="text-sm text-slate-500 mb-4">Para confirmar tu reserva</p>

              {/* Summary pill */}
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 mb-4 flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-teal-800">{booking.service?.name}</p>
                  <p className="text-teal-600 text-xs capitalize">{dateLabel(booking.date)} · {fmtTime(booking.slot!.startTime)}</p>
                </div>
                <p className="font-bold text-teal-700">S/ {Number(booking.service!.price).toFixed(2)}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre completo *</label>
                  <input type="text" value={booking.name} autoFocus
                    onChange={e => setBooking(b => ({ ...b, name: e.target.value }))}
                    placeholder="Juan Pérez"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">DNI *</label>
                  <input type="text" value={booking.dni} maxLength={8}
                    onChange={e => setBooking(b => ({ ...b, dni: e.target.value.replace(/\D/g, '') }))}
                    placeholder="12345678"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono *</label>
                  <input type="tel" value={booking.phone}
                    onChange={e => setBooking(b => ({ ...b, phone: e.target.value }))}
                    placeholder="+51 999 999 999"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Correo electrónico <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <input type="email" value={booking.email}
                    onChange={e => setBooking(b => ({ ...b, email: e.target.value }))}
                    placeholder="juan@email.com"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {!done && step === 'form' && (
          <div className="p-5 border-t border-slate-100 flex-shrink-0">
            <button
              onClick={handleSubmit}
              disabled={submitting || !booking.name || !booking.dni || !booking.phone}
              className="w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Modal ────────────────────────────────────────────────────────────
function CalendarModal({ staff, onSelectDate, onClose }: {
  staff: PublicStaff;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const availableDateSet = new Set(
    staff.schedule.filter(s => s.date >= todayStr).map(s => s.date)
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthLabel = new Date(year, month, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells: (null | { day: number; dateStr: string; available: boolean })[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr, available: availableDateSet.has(dateStr) });
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-md max-h-[95vh] flex flex-col">
        <div className="flex items-center gap-3 p-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar staff={staff} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">{staff.fullName}</p>
              <p className="text-xs text-slate-500">Selecciona una fecha disponible</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg flex-shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prev} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="font-semibold text-slate-900 capitalize">{monthLabel}</span>
            <button onClick={next} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`e${i}`} className="aspect-square" />;
              const isPast = cell.dateStr < todayStr;
              const canSelect = cell.available && !isPast;
              return (
                <button
                  key={cell.dateStr}
                  disabled={!canSelect}
                  onClick={() => onSelectDate(cell.dateStr)}
                  className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    canSelect
                      ? 'text-white bg-teal-500 shadow-sm hover:bg-teal-600 font-bold'
                      : 'text-slate-300 cursor-default'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {availableDateSet.size === 0 && (
            <p className="text-sm text-slate-400 text-center py-6 mt-2">Sin fechas disponibles próximamente</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({ member, onViewCalendar }: { member: PublicStaff; onViewCalendar: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const hasSchedule = member.schedule.some(s => s.date >= today);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <Avatar staff={member} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-lg leading-tight">{member.fullName}</h3>
          {member.specialization && (
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
              {member.specialization}
            </span>
          )}
        </div>
      </div>

      {member.bio && (
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{member.bio}</p>
      )}

      <button
        onClick={onViewCalendar}
        disabled={!hasSchedule}
        className="mt-auto w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
        <Calendar className="w-5 h-5" />
        Ver disponibilidad
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [staff, setStaff] = useState<PublicStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [calendarStaff, setCalendarStaff] = useState<PublicStaff | null>(null);
  const [bookingStaff, setBookingStaff] = useState<PublicStaff | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!TENANT_ID) { setLoadingStaff(false); return; }
    fetchStaff()
      .then(setStaff)
      .catch(() => {})
      .finally(() => setLoadingStaff(false));
  }, []);

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
              <Smile className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">DentalPro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#servicios" className="hover:text-teal-600 transition-colors">Servicios</a>
            <a href="#equipo" className="hover:text-teal-600 transition-colors">Nuestro equipo</a>
            <a href="#contacto" className="hover:text-teal-600 transition-colors">Contacto</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-blue-50 pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.12),transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-teal-500 text-teal-500" />
              Clínica dental de confianza
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              Tu sonrisa en{' '}
              <span className="text-teal-500">manos expertas</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-10">
              Conoce a nuestros especialistas y reserva tu cita online en segundos.
              Diagnóstico personalizado, tecnología de punta y atención cálida para toda la familia.
            </p>
            <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-500">
              {[
                { icon: CheckCircle, text: 'Sin costo la primera consulta' },
                { icon: Clock, text: 'Atención el mismo día' },
                { icon: Shield, text: 'Seguro y profesional' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-teal-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="servicios" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Nuestros servicios</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Tratamientos completos para mantener tu salud bucal y estética dental
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🦷', title: 'Limpieza dental', desc: 'Profilaxis profesional para eliminar sarro y manchas' },
              { icon: '✨', title: 'Blanqueamiento', desc: 'Recupera el blanco natural de tus dientes en una sesión' },
              { icon: '🔧', title: 'Ortodoncia', desc: 'Brackets, alineadores invisibles y ortodoncia estética' },
              { icon: '🪥', title: 'Tratamiento de caries', desc: 'Resinas y restauraciones de alta estética y durabilidad' },
              { icon: '🏥', title: 'Endodoncia', desc: 'Tratamiento de conducto sin dolor con tecnología moderna' },
              { icon: '😁', title: 'Implantes dentales', desc: 'Solución permanente para dientes perdidos' },
            ].map(s => (
              <div key={s.title} className="p-6 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all group">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section id="equipo" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Nuestro equipo</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Profesionales con años de experiencia listos para atenderte
            </p>
          </div>

          {loadingStaff ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-teal-500 mx-auto mb-3" />
            </div>
          ) : !TENANT_ID ? (
            <div className="text-center py-16 text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Configura NEXT_PUBLIC_TENANT_ID para ver el equipo</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No hay profesionales registrados aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map(member => (
                <StaffCard key={member.id} member={member} onViewCalendar={() => setCalendarStaff(member)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contacto" className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
                <Smile className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">DentalPro</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-teal-400" /><span>+51 999 999 999</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-teal-400" /><span>Lun – Sáb · 8am – 7pm</span></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-400" /><span>Lunes a Sábado</span></div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-xs">
            © {new Date().getFullYear()} DentalPro. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* ── Calendar Modal ── */}
      {calendarStaff && (
        <CalendarModal
          staff={calendarStaff}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setCalendarStaff(null);
            setBookingStaff(calendarStaff);
          }}
          onClose={() => setCalendarStaff(null)}
        />
      )}

      {/* ── Booking Modal ── */}
      {bookingStaff && (
        <BookingModal
          staff={bookingStaff}
          initialDate={selectedDate || undefined}
          onClose={() => { setBookingStaff(null); setSelectedDate(''); }}
        />
      )}
    </>
  );
}
