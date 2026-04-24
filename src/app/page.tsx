'use client';

import { useEffect, useState, useRef } from 'react';
import { Calendar, ChevronLeft, X, Check, Loader2, Award } from 'lucide-react';
import { PhoneInput } from '@/components/PhoneInput';
import {
  fetchStaff, fetchStaffServices, fetchAvailability, createBooking,
  fmtTime, TENANT_ID,
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

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const IgIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const WaIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ staff, size = 'md' }: { staff: PublicStaff; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'md' ? 'w-14 h-14 text-xl' : 'w-9 h-9 text-sm';
  if (staff.avatar) return <img src={staff.avatar} alt={staff.fullName} className={`${dim} rounded-full object-cover flex-shrink-0 ring-2 ring-bone-200`} />;
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-bone-200`}
      style={{ background: staff.color || '#a69459' }}>
      {staff.fullName.charAt(0)}
    </div>
  );
}

// ─── Slot Button ─────────────────────────────────────────────────────────────
function SlotBtn({ slot, isFirst, onClick }: { slot: AvailabilitySlot; isFirst: boolean; onClick: () => void }) {
  const pct = slot.available / slot.total;
  const low = pct <= 0.25;
  const mid = pct > 0.25 && pct <= 0.5;
  return (
    <button onClick={onClick}
      className={`relative flex flex-col items-center p-4 rounded-2xl transition-all border ${isFirst
        ? 'border-bone-400 bg-bone-50 ring-1 ring-bone-300'
        : 'border-bone-200 hover:border-bone-400 hover:bg-bone-50'}`}>
      {isFirst && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-bone-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">Próximo</span>}
      <span className="font-bold text-khaki-900 text-base mt-1">{fmtTime(slot.startTime)}</span>
      <span className="text-xs text-khaki-400">{fmtTime(slot.endTime)}</span>
      {slot.available < slot.total && (
        <span className={`text-[10px] mt-0.5 font-semibold ${low ? 'text-red-500' : mid ? 'text-amber-500' : 'text-bone-600'}`}>
          {slot.available === 1 ? '¡Último!' : `${slot.available} lugares`}
        </span>
      )}
    </button>
  );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
type Step = 'service' | 'date' | 'time' | 'form' | 'confirm';
interface BookingState {
  service: PublicService | null; date: string; slot: AvailabilitySlot | null;
  firstName: string; lastName: string; dni: string; phone: string; email: string; notes: string;
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
  const availableDates = [...new Set(staff.schedule.map(s => s.date))].filter(d => d >= today).sort();
  const [booking, setBooking] = useState<BookingState>({
    service: null, date: initialDate || availableDates[0] || today,
    slot: null, firstName: '', lastName: '', dni: '', phone: '', email: '', notes: '',
  });

  useEffect(() => {
    fetchStaffServices(staff.id).then(setServices).catch(() => setServices([])).finally(() => setLoadingSvc(false));
  }, [staff.id]);

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

  const selectService = (svc: PublicService) => { setBooking(b => ({ ...b, service: svc, slot: null })); setStep(initialDate ? 'time' : 'date'); };
  const selectDate = (date: string) => { setBooking(b => ({ ...b, date, slot: null })); setSlotTaken(false); setStep('time'); };
  const selectSlot = (slot: AvailabilitySlot) => { setBooking(b => ({ ...b, slot })); setSlotTaken(false); setStep('form'); };

  const handleSubmit = async () => {
    if (!booking.service || !booking.slot || !booking.firstName || !booking.lastName || !booking.phone || !booking.dni) return;
    setSubmitting(true); setError('');
    try {
      await createBooking({ staffId: staff.id, serviceId: booking.service.id, date: booking.date, startTime: booking.slot.startTime, firstName: booking.firstName, lastName: booking.lastName, dni: booking.dni, phone: booking.phone, email: booking.email || undefined, notes: booking.notes || undefined });
      setDone(true);
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? '';
      const isConflict = e?.response?.status === 409 || msg.toLowerCase().includes('completo') || msg.toLowerCase().includes('conflict');
      if (isConflict) { setSlotTaken(true); setBooking(b => ({ ...b, slot: null })); setStep('time'); }
      else setError(msg || 'Error al reservar. Intente de nuevo.');
    } finally { setSubmitting(false); }
  };

  const stepBack: Record<Step, Step | null> = { service: null, date: 'service', time: initialDate ? 'service' : 'date', form: 'time', confirm: null };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:rounded-3xl sm:max-w-md max-h-[92vh] sm:max-h-[95vh] flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-bone-100 flex-shrink-0">
          {!done && stepBack[step] && (
            <button onClick={() => setStep(stepBack[step]!)} className="p-2 hover:bg-bone-50 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-khaki-500" />
            </button>
          )}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar staff={staff} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-khaki-900 text-sm truncate">{staff.fullName}</p>
              {staff.specialization && <p className="text-xs text-khaki-400 truncate">{staff.specialization}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bone-50 rounded-xl transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-khaki-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5">
          {done && (
            <div className="text-center py-8 sm:py-10">
              <div className="w-20 h-20 bg-bone-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-10 h-10 text-bone-600" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-khaki-900 mb-2">¡Solicitud enviada!</h3>
              <p className="text-khaki-500 text-sm mb-6 leading-relaxed">
                Tu cita para el <span className="font-semibold text-khaki-700 capitalize">{dateLabel(booking.date)}</span> a las{' '}
                <span className="font-semibold text-khaki-700">{fmtTime(booking.slot!.startTime)}</span> ha sido recibida.
                Te contactaremos en breve para confirmar.
              </p>
              <div className="bg-bone-50 border border-bone-100 rounded-2xl p-4 text-left text-sm space-y-2.5 mb-6">
                {[
                  { label: 'Servicio', val: booking.service?.name },
                  { label: 'Profesional', val: staff.fullName },
                  { label: 'Duración', val: fmtDuration(booking.service!.durationMinutes) },
                  { label: 'Precio', val: `S/ ${Number(booking.service!.price).toFixed(2)}` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-khaki-400">{r.label}</span>
                    <span className="font-medium text-khaki-800">{r.val}</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full py-4 bg-bone-500 text-white rounded-2xl font-semibold hover:bg-bone-600 transition-colors text-base">
                Entendido
              </button>
            </div>
          )}

          {!done && step === 'service' && (
            <div>
              <h3 className="font-serif font-bold text-khaki-900 text-xl mb-1">¿Qué servicio necesitas?</h3>
              {initialDate
                ? <p className="text-sm text-bone-600 mb-5 flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span className="capitalize">{dateLabel(initialDate)}</span></p>
                : <p className="text-sm text-khaki-400 mb-5">Selecciona el tratamiento que deseas</p>}
              {loadingSvc
                ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-bone-500" /></div>
                : services.length === 0
                  ? <p className="text-sm text-khaki-400 text-center py-10">Sin servicios disponibles</p>
                  : <div className="space-y-2">
                    {services.map(svc => (
                      <button key={svc.id} onClick={() => selectService(svc)}
                        className="w-full flex items-center justify-between p-4 border border-bone-100 rounded-2xl hover:border-bone-400 hover:bg-bone-50 transition-all text-left group active:scale-[0.99]">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: svc.color || '#a69459' }} />
                          <div>
                            <p className="font-semibold text-khaki-900 text-sm group-hover:text-bone-700 transition-colors">{svc.name}</p>
                            {svc.description && <p className="text-xs text-khaki-400 line-clamp-1 mt-0.5">{svc.description}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-bold text-khaki-900">S/ {Number(svc.price).toFixed(2)}</p>
                          <p className="text-xs text-khaki-400">{fmtDuration(svc.durationMinutes)}</p>
                        </div>
                      </button>
                    ))}
                  </div>}
            </div>
          )}

          {!done && step === 'date' && (
            <div>
              <h3 className="font-serif font-bold text-khaki-900 text-xl mb-1">¿Qué día prefieres?</h3>
              <p className="text-sm text-khaki-400 mb-5">Fechas con disponibilidad confirmada</p>
              {availableDates.length === 0
                ? <p className="text-sm text-khaki-400 text-center py-10">Sin fechas disponibles próximamente</p>
                : <div className="space-y-2">
                  {availableDates.map((d, idx) => {
                    const blocks = staff.schedule.filter(s => s.date === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
                    const hasMorning = blocks.some(s => s.startTime < '13:00');
                    const hasAfternoon = blocks.some(s => s.startTime >= '13:00');
                    const label = new Date(d + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
                    const isNext = idx === 0;
                    return (
                      <button key={d} onClick={() => selectDate(d)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left border active:scale-[0.99] ${isNext ? 'border-bone-300 bg-bone-50' : 'border-bone-100 hover:border-bone-300 hover:bg-bone-50'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-khaki-900 text-sm capitalize">{label}</p>
                            {isNext && <span className="text-[10px] font-bold bg-bone-500 text-white px-2 py-0.5 rounded-full">Próximo</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            {hasMorning && <span className="text-xs text-amber-600 font-medium flex items-center gap-1">☀️ Mañana</span>}
                            {hasAfternoon && <span className="text-xs text-blue-600 font-medium flex items-center gap-1">🌤️ Tarde</span>}
                          </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-khaki-300 rotate-180 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>}
            </div>
          )}

          {!done && step === 'time' && (
            <div>
              <h3 className="font-serif font-bold text-khaki-900 text-xl mb-0.5">Elige tu horario</h3>
              <p className="text-sm text-khaki-400 mb-5 capitalize">{dateLabel(booking.date)}</p>
              {slotTaken && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs mb-4">
                  <span className="mt-0.5">⚠️</span><span>Ese horario ya fue tomado. Por favor elige otro.</span>
                </div>
              )}
              {loadingSlots
                ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-bone-500" /></div>
                : availability.length === 0
                  ? <p className="text-sm text-khaki-400 text-center py-10">Sin horarios disponibles para este día</p>
                  : (() => {
                    const nextMorning = availability.find(s => s.startTime < '13:00') ?? null;
                    const nextAfternoon = availability.find(s => s.startTime >= '13:00') ?? null;
                    return (
                      <div className="space-y-5">
                        {[
                          { slot: nextMorning, label: 'Turno mañana', icon: '☀️', color: 'text-amber-700' },
                          { slot: nextAfternoon, label: 'Turno tarde', icon: '🌤️', color: 'text-blue-700' },
                        ].map(({ slot, label, icon, color }) => slot
                          ? <div key={label}><div className="flex items-center gap-2 mb-3"><span>{icon}</span><span className={`text-xs font-bold uppercase tracking-wide ${color}`}>{label}</span></div><SlotBtn slot={slot} isFirst onClick={() => selectSlot(slot)} /></div>
                          : <div key={label} className="flex items-center gap-3 p-3 bg-bone-50 rounded-xl"><span>{icon}</span><div><p className={`text-xs font-bold uppercase tracking-wide ${color}`}>{label}</p><p className="text-xs text-khaki-400 mt-0.5">Sin disponibilidad</p></div></div>
                        )}
                      </div>
                    );
                  })()}
            </div>
          )}

          {!done && step === 'form' && (
            <div>
              <h3 className="font-serif font-bold text-khaki-900 text-xl mb-1">Tus datos</h3>
              <p className="text-sm text-khaki-400 mb-4">Completa para confirmar tu reserva</p>
              <div className="bg-bone-50 border border-bone-100 rounded-2xl p-3.5 mb-5 flex items-center justify-between text-sm">
                <div><p className="font-semibold text-bone-800">{booking.service?.name}</p><p className="text-bone-500 text-xs capitalize mt-0.5">{dateLabel(booking.date)} · {fmtTime(booking.slot!.startTime)}</p></div>
                <p className="font-bold text-bone-700 text-base">S/ {Number(booking.service!.price).toFixed(2)}</p>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Nombres *', val: booking.firstName, key: 'firstName', ph: 'Juan', type: 'text', autoFocus: true },
                    { label: 'Apellidos *', val: booking.lastName, key: 'lastName', ph: 'Pérez', type: 'text', autoFocus: false },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-khaki-500 mb-1.5">{f.label}</label>
                      <input type={f.type} value={f.val} autoFocus={f.autoFocus}
                        onChange={e => setBooking(b => ({ ...b, [f.key]: e.target.value }))}
                        placeholder={f.ph}
                        className="w-full border border-bone-200 rounded-xl px-3.5 py-3 text-sm bg-white text-khaki-900" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-khaki-500 mb-1.5">DNI *</label>
                  <input type="text" value={booking.dni} maxLength={8} onChange={e => setBooking(b => ({ ...b, dni: e.target.value.replace(/\D/g, '') }))} placeholder="12345678" className="w-full border border-bone-200 rounded-xl px-3.5 py-3 text-sm bg-white text-khaki-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-khaki-500 mb-1.5">WhatsApp *</label>
                  <PhoneInput value={booking.phone} onChange={v => setBooking(b => ({ ...b, phone: v }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-khaki-500 mb-1.5">Correo <span className="font-normal text-khaki-400">(opcional)</span></label>
                  <input type="email" value={booking.email} onChange={e => setBooking(b => ({ ...b, email: e.target.value }))} placeholder="juan@correo.com" className="w-full border border-bone-200 rounded-xl px-3.5 py-3 text-sm bg-white text-khaki-900" />
                </div>
              </div>
              {error && <p className="text-xs text-red-500 mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>
          )}
        </div>

        {!done && step === 'form' && (
          <div className="px-5 sm:px-6 py-4 border-t border-bone-100 flex-shrink-0">
            <button onClick={handleSubmit} disabled={submitting || !booking.firstName || !booking.lastName || !booking.phone || !booking.dni}
              className="w-full py-4 bg-bone-500 text-white rounded-2xl font-semibold hover:bg-bone-600 disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-base active:scale-[0.99]">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'Enviando...' : 'Confirmar solicitud'}
            </button>
            <p className="text-center text-xs text-khaki-400 mt-2">Tu información está protegida y es confidencial</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Modal ────────────────────────────────────────────────────────────
function CalendarModal({ staff, onSelectDate, onClose }: { staff: PublicStaff; onSelectDate: (date: string) => void; onClose: () => void }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const availableDateSet = new Set(staff.schedule.filter(s => s.date >= todayStr).map(s => s.date));
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
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:rounded-3xl sm:max-w-md max-h-[92vh] sm:max-h-[95vh] flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-bone-100 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar staff={staff} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-khaki-900 text-sm truncate">{staff.fullName}</p>
              <p className="text-xs text-khaki-400">Selecciona una fecha disponible</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bone-50 rounded-xl flex-shrink-0 transition-colors">
            <X className="w-5 h-5 text-khaki-400" />
          </button>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <button onClick={prev} className="p-2.5 hover:bg-bone-50 rounded-xl transition-colors active:scale-95"><ChevronLeft className="w-5 h-5 text-khaki-600" /></button>
            <span className="font-serif font-semibold text-khaki-900 capitalize">{monthLabel}</span>
            <button onClick={next} className="p-2.5 hover:bg-bone-50 rounded-xl transition-colors active:scale-95"><ChevronLeft className="w-5 h-5 text-khaki-600 rotate-180" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-khaki-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`e${i}`} className="aspect-square" />;
              const isPast = cell.dateStr < todayStr;
              const canSelect = cell.available && !isPast;
              return (
                <button key={cell.dateStr} disabled={!canSelect} onClick={() => onSelectDate(cell.dateStr)}
                  className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all active:scale-95 ${canSelect ? 'text-white bg-bone-500 hover:bg-bone-600 font-bold shadow-sm' : 'text-khaki-300 cursor-default'}`}>
                  {cell.day}
                </button>
              );
            })}
          </div>
          {availableDateSet.size === 0 && <p className="text-sm text-khaki-400 text-center py-6 mt-2">Sin fechas disponibles próximamente</p>}
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
    <div className="group bg-white border border-bone-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-bone-200/60 transition-all duration-300 flex flex-col">
      <div className="bg-gradient-to-br from-bone-50 to-bone-100 px-6 sm:px-7 pt-7 sm:pt-8 pb-5 sm:pb-6 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <Avatar staff={member} size="lg" />
          {hasSchedule && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-2 h-2 bg-white rounded-full" />
            </span>
          )}
        </div>
        <h3 className="font-serif font-bold text-khaki-900 text-lg leading-tight">{member.fullName}</h3>
        {member.specialization && (
          <span className="inline-block mt-2 px-3 py-1 bg-bone-200 text-bone-800 rounded-full text-xs font-semibold tracking-wide">
            {member.specialization}
          </span>
        )}
      </div>
      {member.bio && (
        <div className="px-6 sm:px-7 py-4 sm:py-5 flex-1">
          <p className="text-sm text-khaki-500 leading-relaxed line-clamp-3">{member.bio}</p>
        </div>
      )}
      <div className="px-6 sm:px-7 pb-6 sm:pb-7 mt-auto">
        <button onClick={onViewCalendar} disabled={!hasSchedule}
          className="w-full py-4 bg-bone-500 text-white rounded-2xl font-semibold hover:bg-bone-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2 group-hover:shadow-md group-hover:shadow-bone-300/50 active:scale-[0.98]">
          <Calendar className="w-4 h-4" />
          {hasSchedule ? 'Reservar cita' : 'Sin disponibilidad'}
        </button>
      </div>
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const touchStartX = useRef(0);
  const carouselTotal = 5;

  const carouselSlides = [
    { src: '/carousel/1.jpg', label: '¿Necesitas ortodoncia?' },
    { src: '/carousel/2.jpg', label: 'Corrección de apiñamiento' },
    { src: '/carousel/3.jpg', label: 'Cierre de espacios dentales' },
    { src: '/carousel/4.jpg', label: 'Tratamiento de mordida' },
    { src: '/carousel/5.jpg', label: 'Visítanos · Av. Mario Urteaga 218' },
  ];

  const goTo = (n: number) => setCarouselIdx(((n % carouselTotal) + carouselTotal) % carouselTotal);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => goTo(carouselIdx + 1), 4500);
    return () => clearInterval(t);
  }, [carouselIdx]);

  useEffect(() => {
    if (!TENANT_ID) { setLoadingStaff(false); return; }
    fetchStaff().then(setStaff).catch(() => {}).finally(() => setLoadingStaff(false));
  }, []);

  const navLinks = [
    { href: '#servicios', label: 'Servicios' },
    { href: '#nosotros', label: 'Nosotros' },
    { href: '#resultados', label: 'Resultados' },
    { href: '#equipo', label: 'Especialistas' },
  ];

  return (
    <>
      {/* ─────────────── NAVBAR ─────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <a href="#" className="flex items-center gap-3">
              <img src="/velco-logo.png" alt="Velco" className="h-8 sm:h-9 w-auto" />
            </a>

            <ul className="hidden md:flex items-center gap-8">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <a href={href}
                    className={`text-sm font-medium transition-colors duration-300 relative after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-px after:transition-all hover:after:w-full ${
                      scrolled
                        ? 'text-khaki-700 hover:text-bone-600 after:bg-bone-500'
                        : 'text-white/85 hover:text-white after:bg-white/60'
                    }`}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden md:flex items-center gap-3">
              <a href="https://wa.me/51976255210" target="_blank" rel="noopener"
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${scrolled ? 'text-khaki-600 hover:text-bone-600' : 'text-white/70 hover:text-white'}`}>
                <WaIcon className="w-4 h-4" />
                976 255 210
              </a>
              <div className={`w-px h-5 ${scrolled ? 'bg-bone-300' : 'bg-white/20'}`} />
              <a href="https://www.instagram.com/velco.oe" target="_blank" rel="noopener"
                className={`transition-colors ${scrolled ? 'text-khaki-500 hover:text-bone-600' : 'text-white/60 hover:text-white'}`}>
                <IgIcon className="w-5 h-5" />
              </a>
              <a href="#equipo"
                className="ml-1 px-5 py-2.5 bg-bone-500 hover:bg-bone-600 text-white text-sm font-semibold rounded-full transition-all shadow-sm hover:shadow-md hover:shadow-bone-900/20">
                Reservar cita
              </a>
            </div>

            <button onClick={() => setMobileOpen(o => !o)}
              className={`md:hidden p-2.5 rounded-xl transition-colors ${scrolled ? 'text-khaki-700 hover:bg-bone-100' : 'text-white hover:bg-white/10'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-bone-50/98 backdrop-blur-xl border-t border-bone-200 px-4 py-4 flex flex-col shadow-lg">
            <div className="flex flex-col gap-1 mb-3">
              {navLinks.map(({ href, label }) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)}
                  className="flex items-center px-4 py-3.5 text-sm font-medium text-khaki-700 hover:text-bone-600 hover:bg-bone-100 rounded-2xl transition-colors">
                  {label}
                </a>
              ))}
            </div>
            <div className="pt-3 border-t border-bone-200 flex flex-col gap-2.5">
              <a href="https://wa.me/51976255210" target="_blank" rel="noopener"
                className="flex items-center justify-center gap-2 px-5 py-3.5 border border-bone-200 text-khaki-700 text-sm font-medium rounded-2xl hover:bg-bone-100 transition-colors">
                <WaIcon className="w-4 h-4 text-bone-500" /> Escribir por WhatsApp
              </a>
              <a href="#equipo" onClick={() => setMobileOpen(false)}
                className="text-center px-5 py-3.5 bg-bone-500 text-white text-sm font-semibold rounded-2xl shadow-sm">
                Reservar cita gratis
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ─────────────── HERO ─────────────── */}
      <section className="min-h-screen flex items-center pt-16 sm:pt-20 relative overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/vi.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, rgba(15,12,8,0.85) 0%, rgba(21,18,14,0.70) 50%, rgba(33,30,18,0.50) 100%)' }} />
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to top, rgba(15,12,8,0.75) 0%, transparent 55%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-14 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-white/8 border border-white/15 rounded-full text-bone-200 text-[10px] sm:text-xs font-semibold tracking-[0.12em] sm:tracking-[0.15em] uppercase mb-6 sm:mb-8 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                Odontología de Alta Especialidad
              </div>

              <h1 className="text-[2.15rem] leading-[1.1] sm:text-5xl lg:text-[3.8rem] xl:text-[4.5rem] font-serif font-bold text-white mb-5 sm:mb-7">
                Donde la ciencia<br />
                dental se convierte<br />
                en <span className="italic text-bone-300">arte</span>
              </h1>

              <p className="text-base sm:text-lg text-white/70 leading-relaxed mb-8 sm:mb-10 max-w-xl font-light">
                Más de una década creando sonrisas que transforman vidas. Tecnología de vanguardia,
                especialistas certificados y un enfoque completamente personalizado para ti.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 sm:mb-14">
                <a href="#equipo"
                  className="inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-4 bg-bone-500 hover:bg-bone-400 text-white font-semibold rounded-full transition-all shadow-lg shadow-bone-900/30 hover:shadow-xl hover:shadow-bone-900/40 active:scale-[0.98]">
                  Agendar consulta gratuita
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
                <a href="#resultados"
                  className="inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-4 border border-white/25 text-white hover:bg-white/10 font-medium rounded-full transition-all backdrop-blur-sm">
                  Ver casos de éxito
                </a>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-0 flex-wrap">
                {[
                  { val: '+2,500', label: 'Pacientes transformados' },
                  { val: '10+', label: 'Años de experiencia' },
                  { val: '4.9★', label: 'Calificación Google' },
                ].map((s, i) => (
                  <div key={s.val} className="flex items-center">
                    <div className="text-center px-4 sm:px-6 first:pl-0">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white">{s.val}</div>
                      <div className="text-[10px] sm:text-xs text-white/50 mt-0.5 whitespace-nowrap">{s.label}</div>
                    </div>
                    {i < 2 && <div className="w-px h-8 sm:h-10 bg-white/15" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — glass card, visible from sm (tablet) */}
            <div className="hidden sm:flex justify-center lg:justify-end items-center">
              <div className="relative">
                <div className="w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] lg:w-[340px] lg:h-[340px] rounded-[2.5rem] border border-white/15 bg-white/8 backdrop-blur-md flex items-center justify-center shadow-2xl">
                  <img src="/velco-logo.png" alt="Velco" className="w-52 sm:w-60 lg:w-72 h-auto object-contain drop-shadow-2xl" />
                </div>

                <div className="absolute -top-4 sm:-top-5 -right-4 sm:-right-5 bg-white rounded-2xl shadow-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5 border border-bone-50">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-khaki-900">Citas disponibles</p>
                    <p className="text-[10px] text-khaki-400">Agenda hoy mismo</p>
                  </div>
                </div>

                <div className="absolute -bottom-4 sm:-bottom-5 -left-4 sm:-left-5 bg-white rounded-2xl shadow-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5 border border-bone-50">
                  <div className="flex -space-x-1.5">
                    {['MR', 'JL', 'AV'].map(i => (
                      <div key={i} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-bone-400 border-2 border-white flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white">{i}</div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-2.5 h-2.5 text-amber-400" />)}
                    </div>
                    <p className="text-[10px] text-khaki-500 mt-0.5">+340 reseñas</p>
                  </div>
                </div>

                <div className="absolute inset-0 rounded-[2.5rem] border border-white/8 scale-110 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator — moved up on mobile for floating CTA */}
        <div className="absolute bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/40">
          <span className="text-[10px] tracking-widest uppercase font-medium">Descubre más</span>
          <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ─────────────── TRUST BAR ─────────────── */}
      <section className="bg-khaki-900 py-7 sm:py-8 border-y border-khaki-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex items-center justify-center lg:justify-between gap-4 sm:gap-6 lg:gap-0">
            {[
              {
                icon: <svg className="w-5 h-5 sm:w-6 sm:h-6 text-bone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
                label: 'Cirujanos Certificados',
              },
              {
                icon: <svg className="w-5 h-5 sm:w-6 sm:h-6 text-bone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.614.25M14.25 3.104c.251.023.501.05.75.082M19.5 6.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
                label: 'Tecnología Digital 3D',
              },
              {
                icon: <svg className="w-5 h-5 sm:w-6 sm:h-6 text-bone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                label: 'Atención sin Dolor',
              },
              {
                icon: <svg className="w-5 h-5 sm:w-6 sm:h-6 text-bone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" /></svg>,
                label: 'Planes de Financiamiento',
              },
              {
                icon: <svg className="w-5 h-5 sm:w-6 sm:h-6 text-bone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                label: 'Primera Consulta Gratis',
              },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2.5 sm:gap-3 ${i === 4 ? 'col-span-2 sm:col-span-1 justify-center sm:justify-start' : ''}`}>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-bone-500/15 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-xs sm:text-sm font-medium text-bone-300 leading-snug">{item.label}</span>
                {i < 4 && <div className="hidden lg:block w-px h-8 bg-khaki-800 ml-6" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── SERVICIOS ─────────────── */}
      <section id="servicios" className="py-14 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14 lg:mb-20 reveal">
            <span className="inline-block px-4 py-1.5 bg-bone-100 text-bone-700 text-[11px] font-bold tracking-[0.15em] uppercase rounded-full mb-4 sm:mb-5">Nuestros tratamientos</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-khaki-900 mb-4 sm:mb-5">
              Soluciones completas para<br />
              <span className="italic text-bone-500">cada sonrisa</span>
            </h2>
            <p className="text-khaki-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed font-light">
              Combinamos ciencia avanzada con un toque artístico para crear resultados que van más allá de tus expectativas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Featured – Diseño de Sonrisa */}
            <div className="sm:col-span-2 lg:col-span-1 lg:row-span-2 bg-gradient-to-b from-bone-500 to-bone-700 rounded-3xl p-6 sm:p-8 lg:p-9 flex flex-col text-white card-hover reveal relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-16 translate-x-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 translate-y-10 -translate-x-10 pointer-events-none" />
              <div className="relative">
                <div className="inline-flex w-12 h-12 sm:w-14 sm:h-14 bg-white/15 rounded-2xl items-center justify-center mb-5 sm:mb-7">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-bone-200 text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3">Tratamiento estrella</p>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold mb-3 sm:mb-4 leading-tight">Diseño de<br />Sonrisa Digital</h3>
                <p className="text-bone-100/80 leading-relaxed mb-5 sm:mb-7 font-light text-sm sm:text-base">
                  Visualiza tu nueva sonrisa antes de comenzar el tratamiento. Usamos tecnología DSD (Digital Smile Design) para diseñar resultados a tu medida con carillas, coronas y blanqueamiento profesional.
                </p>
                <ul className="space-y-2 sm:space-y-2.5 mb-7 sm:mb-10">
                  {['Carillas de porcelana ultrafinas', 'Blanqueamiento LED profesional', 'Coronas cerámicas de alta estética', 'Diseño digital previo al tratamiento'].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-bone-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-bone-200 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <a href="#equipo" className="mt-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-semibold rounded-2xl transition-all active:scale-[0.98]">
                Quiero mi diseño de sonrisa
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>

            {/* Service cards */}
            {[
              {
                icon: <svg className="w-5 h-5 text-bone-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.614.25" /></svg>,
                title: 'Implantes Dentales',
                tag: 'Solución definitiva',
                desc: 'Recupera la función y estética de tus dientes perdidos con implantes de titanio de última generación. Resultados naturales y de por vida.',
              },
              {
                icon: <svg className="w-5 h-5 text-bone-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                title: 'Ortodoncia Invisible',
                tag: 'Sin brackets',
                desc: 'Alineadores transparentes a medida que corrigen tu mordida discretamente. Compatible con tu vida profesional y social.',
              },
              {
                icon: <svg className="w-5 h-5 text-bone-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
                title: 'Odontología General',
                tag: 'Preventiva y estética',
                desc: 'Diagnóstico precoz, limpiezas profundas, endodoncias sin dolor y restauraciones estéticas para una boca sana y una sonrisa radiante.',
              },
              {
                icon: <svg className="w-5 h-5 text-bone-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
                title: 'Odontopediatría',
                tag: 'Para los más pequeños',
                desc: 'Un entorno diseñado para que los niños se sientan seguros y cómodos. Construimos hábitos de salud dental que duran toda la vida.',
              },
            ].map(s => (
              <div key={s.title} className="bg-bone-50 border border-bone-100 rounded-3xl p-5 sm:p-7 flex flex-col gap-4 sm:gap-5 card-hover reveal group">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white border border-bone-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-bone-300 transition-colors">
                    {s.icon}
                  </div>
                  <span className="text-[10px] font-bold text-bone-500 bg-bone-100 px-2.5 py-1 rounded-full tracking-wide uppercase">{s.tag}</span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-khaki-900 mb-2">{s.title}</h3>
                  <p className="text-khaki-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
                <a href="#equipo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-bone-600 hover:text-bone-700 transition-colors mt-auto group-hover:gap-2.5">
                  Consultar ahora
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── PROCESO ─────────────── */}
      <section className="py-14 sm:py-20 lg:py-24 bg-bone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14 lg:mb-16 reveal">
            <span className="inline-block px-4 py-1.5 bg-bone-100 text-bone-700 text-[11px] font-bold tracking-[0.15em] uppercase rounded-full mb-4 sm:mb-5">Así de simple</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-khaki-900 mb-4">
              Tu camino hacia la<br /><span className="italic text-bone-500">sonrisa perfecta</span>
            </h2>
          </div>

          <div className="relative">
            {/* Vertical connector on mobile */}
            <div className="md:hidden absolute left-[2.4rem] top-14 bottom-14 w-px bg-gradient-to-b from-bone-200 via-bone-400 to-bone-200 pointer-events-none" />
            {/* Horizontal connector on desktop */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-bone-200 via-bone-400 to-bone-200 pointer-events-none" />

            <div className="grid md:grid-cols-3 gap-5 sm:gap-7 md:gap-8">
              {[
                {
                  step: '01',
                  title: 'Consulta gratuita',
                  desc: 'Agenda tu primera visita sin costo. Nuestros especialistas evalúan tu caso, responden todas tus dudas y diseñan un plan a tu medida.',
                  icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-bone-500" />,
                },
                {
                  step: '02',
                  title: 'Plan personalizado',
                  desc: 'Usamos tecnología de imagen digital para mostrarte cómo lucirá tu sonrisa antes de comenzar. Tú apruebas, nosotros ejecutamos.',
                  icon: <svg className="w-5 h-5 sm:w-6 sm:h-6 text-bone-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M14.25 3.104c.251.023.501.05.75.082M19.5 6.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
                },
                {
                  step: '03',
                  title: 'Tu sonrisa ideal',
                  desc: 'Completa tu tratamiento y estrena la sonrisa que siempre soñaste. Seguimiento incluido para garantizar resultados duraderos.',
                  icon: <svg className="w-5 h-5 sm:w-6 sm:h-6 text-bone-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                },
              ].map((p) => (
                <div key={p.step} className="flex md:flex-col items-start md:items-center gap-4 sm:gap-5 md:gap-0 md:text-center reveal">
                  <div className="relative flex-shrink-0 md:mb-6">
                    <div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white border border-bone-100 shadow-sm flex items-center justify-center">
                      {p.icon}
                    </div>
                    <div className="absolute -top-2.5 -right-2.5 w-7 h-7 md:w-8 md:h-8 bg-bone-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{p.step}</span>
                    </div>
                  </div>
                  <div className="flex-1 pb-4 md:pb-0">
                    <h3 className="font-serif font-bold text-khaki-900 text-lg sm:text-xl mb-1.5 sm:mb-2">{p.title}</h3>
                    <p className="text-khaki-400 text-sm leading-relaxed md:max-w-xs">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10 sm:mt-12">
            <a href="#equipo" className="inline-flex items-center gap-2.5 px-8 py-4 bg-bone-500 hover:bg-bone-600 text-white font-semibold rounded-full transition-all shadow-md hover:shadow-lg hover:shadow-bone-300/40">
              Comenzar ahora — Es gratis
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────── NOSOTROS ─────────────── */}
      <section id="nosotros" className="py-14 sm:py-20 lg:py-28 bg-khaki-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-bone-600/10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-bone-500/8 translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-center">
            <div className="relative reveal">
              <div className="bg-khaki-800 rounded-3xl p-6 sm:p-8 lg:p-10 relative overflow-hidden border border-khaki-700/50">
                <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-bone-500/8 -translate-y-20 translate-x-20" />
                <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-bone-400/8 translate-y-12 -translate-x-12" />
                <div className="relative z-10 text-center py-2 sm:py-4">
                  <img src="/about.jpg" alt="Equipo Velco" className="w-36 sm:w-48 h-auto mx-auto mb-5 sm:mb-7 rounded-2xl opacity-95 shadow-xl" />
                  <p className="text-bone-300 text-sm font-medium italic">"Tu sonrisa saludable, nuestra pasión"</p>
                  <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { val: '+2,500', label: 'Pacientes' },
                      { val: '10+', label: 'Años' },
                      { val: '4.9', label: 'Google' },
                    ].map(s => (
                      <div key={s.val} className="bg-khaki-700/80 rounded-2xl p-3 sm:p-4 text-center border border-khaki-600/30">
                        <div className="text-lg sm:text-xl font-serif font-bold text-bone-300">{s.val}</div>
                        <div className="text-[11px] text-bone-500 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-3 sm:-bottom-4 -right-3 sm:-right-4 bg-bone-500 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 shadow-xl">
                <div className="text-white text-xs font-bold tracking-wide">✓ Certificados internacionalmente</div>
              </div>
            </div>

            <div className="reveal">
              <span className="inline-block px-4 py-1.5 bg-bone-500/20 text-bone-300 text-[11px] font-bold tracking-[0.15em] uppercase rounded-full mb-5 sm:mb-7">¿Quiénes somos?</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-bone-50 leading-tight mb-5 sm:mb-6">
                Más de una década<br />creando sonrisas<br />que duran toda la vida
              </h2>
              <p className="text-bone-300 leading-relaxed mb-4 sm:mb-5 font-light text-base sm:text-lg">
                En Velco fusionamos la precisión científica con la sensibilidad artística. Cada tratamiento es el resultado de años de formación, tecnología de vanguardia y un compromiso inquebrantable con tu bienestar.
              </p>
              <p className="text-bone-400 leading-relaxed mb-8 sm:mb-10 font-light text-sm sm:text-base">
                Porque entendemos que una visita al dentista puede generar ansiedad, hemos diseñado cada rincón de nuestra clínica y cada momento de tu experiencia para que te sientas tranquilo, cuidado y en las mejores manos.
              </p>
              <div className="space-y-4 sm:space-y-5">
                {[
                  {
                    icon: <svg className="w-5 h-5 text-bone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .615.415 1.16 1.007 1.337l.256.077a11.976 11.976 0 002.994.542" /></svg>,
                    title: 'Tecnología 3D de última generación',
                    desc: 'Escáner intraoral, tomografía 3D y diseño digital de sonrisa para diagnósticos precisos y resultados predecibles.',
                  },
                  {
                    icon: <svg className="w-5 h-5 text-bone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                    title: 'Atención sin ansiedad',
                    desc: 'Técnicas anestésicas avanzadas, sedación consciente disponible y un equipo entrenado en odontología de baja ansiedad.',
                  },
                  {
                    icon: <svg className="w-5 h-5 text-bone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25" /></svg>,
                    title: 'Financiamiento flexible',
                    desc: 'Planes de pago adaptados a tu presupuesto para que tu salud y estética dental nunca queden postergadas.',
                  },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-3 sm:gap-4 group">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-bone-500/15 flex items-center justify-center shrink-0 group-hover:bg-bone-500/25 transition-colors">
                      {f.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-bone-100 mb-1 text-sm sm:text-base">{f.title}</div>
                      <div className="text-xs sm:text-sm text-bone-400 leading-relaxed font-light">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── RESULTADOS ─────────────── */}
      <section id="resultados" className="py-14 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-center">
            {/* Carousel — first on mobile */}
            <div className="reveal order-1 lg:order-2">
              <div className="relative">
                <div
                  className="overflow-hidden rounded-3xl shadow-2xl border border-bone-100 cursor-grab active:cursor-grabbing"
                  onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    const diff = touchStartX.current - e.changedTouches[0].clientX;
                    if (Math.abs(diff) > 40) goTo(carouselIdx + (diff > 0 ? 1 : -1));
                  }}
                >
                  <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${carouselIdx * 100}%)` }}>
                    {carouselSlides.map(img => (
                      <div key={img.src} className="w-full flex-shrink-0 relative">
                        <img src={img.src} alt={img.label} className="w-full object-cover aspect-square sm:aspect-[4/5]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                          <p className="text-white font-medium text-sm">{img.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => goTo(carouselIdx - 1)}
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 shadow-lg flex items-center justify-center text-khaki-700 hover:bg-white hover:scale-105 transition-all active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => goTo(carouselIdx + 1)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 shadow-lg flex items-center justify-center text-khaki-700 hover:bg-white hover:scale-105 transition-all active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                <div className="flex justify-center gap-2 mt-4 sm:mt-5">
                  {carouselSlides.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)}
                      className={`rounded-full transition-all duration-300 ${i === carouselIdx ? 'w-6 h-2 bg-bone-500' : 'w-2 h-2 bg-bone-200 hover:bg-bone-300'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Text — second on mobile */}
            <div className="reveal order-2 lg:order-1">
              <span className="inline-block px-4 py-1.5 bg-bone-100 text-bone-700 text-[11px] font-bold tracking-[0.15em] uppercase rounded-full mb-4 sm:mb-5">Casos reales</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-khaki-900 leading-tight mb-4 sm:mb-6">
                Cada sonrisa cuenta<br />
                una historia de<br />
                <span className="italic text-bone-500">transformación</span>
              </h2>
              <p className="text-khaki-400 leading-relaxed mb-6 sm:mb-8 font-light text-base sm:text-lg">
                Estos son algunos de los casos de nuestros pacientes. Resultados reales,
                sin filtros, que demuestran la calidad de nuestro trabajo y nuestra dedicación.
              </p>
              <div className="flex flex-col gap-3 sm:gap-4 mb-8 sm:mb-10">
                {[
                  'Tratamientos personalizados según tu anatomía facial',
                  'Materiales de grado A importados y certificados',
                  'Garantía escrita en todos nuestros tratamientos',
                  'Seguimiento post-tratamiento incluido',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-bone-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-5 h-5 text-bone-500" />
                    </div>
                    <span className="text-sm text-khaki-600">{item}</span>
                  </div>
                ))}
              </div>
              <a href="#equipo" className="inline-flex items-center gap-2.5 px-8 py-4 bg-bone-500 hover:bg-bone-600 text-white font-semibold rounded-full transition-all shadow-md hover:shadow-lg hover:shadow-bone-300/40">
                Quiero mi transformación
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── TESTIMONIOS ─────────────── */}
      <section className="py-14 sm:py-20 lg:py-28 bg-bone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-9 sm:mb-14 lg:mb-20 reveal">
            <span className="inline-block px-4 py-1.5 bg-bone-100 text-bone-700 text-[11px] font-bold tracking-[0.15em] uppercase rounded-full mb-4 sm:mb-5">Testimonios</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-khaki-900 mb-3 sm:mb-4">
              Más de 2,500 pacientes<br />
              <span className="italic text-bone-500">confían en nosotros</span>
            </h2>
            <p className="text-khaki-400 text-base sm:text-lg max-w-md mx-auto font-light">Experiencias reales de personas que transformaron su sonrisa y su confianza.</p>
          </div>

          {/* Horizontal scroll on mobile, grid on sm+ */}
          <div className="flex sm:grid sm:grid-cols-3 overflow-x-auto snap-x -mx-4 sm:mx-0 px-4 sm:px-0 gap-4 pb-4 sm:pb-0 mb-8 sm:mb-10 scrollbar-hide">
            {[
              {
                quote: 'Llevo años queriendo hacerme las carillas y siempre lo postergaba. Finalmente me animé y el resultado superó todo lo que esperaba. El equipo de Velco me hizo sentir segura en cada paso. ¡Mi sonrisa cambió mi vida!',
                name: 'María Rodríguez',
                initials: 'MR',
                service: 'Diseño de Sonrisa · Carillas',
                featured: false,
              },
              {
                quote: 'Soy odontofóbico declarado. Aquí por primera vez no sentí ansiedad. La Dra. me explicó todo, me tomaron el tiempo necesario y el resultado de mis implantes es increíble. Ahora sonrío sin vergüenza.',
                name: 'José Luis Paredes',
                initials: 'JL',
                service: 'Implantes Dentales',
                featured: true,
              },
              {
                quote: 'Mis tres hijos vienen a Velco y cada uno ama venir al dentista. El espacio para niños es increíble, el personal tiene una paciencia enorme y los resultados son excelentes. ¡Los recomiendo al 200%!',
                name: 'Ana Vásquez',
                initials: 'AV',
                service: 'Odontopediatría · Familia',
                featured: false,
              },
            ].map(t => (
              <div key={t.name}
                className={`flex-shrink-0 w-[82vw] sm:w-auto snap-center rounded-3xl p-6 sm:p-8 card-hover reveal flex flex-col ${t.featured
                  ? 'bg-gradient-to-b from-bone-500 to-bone-700 shadow-xl shadow-bone-300/30'
                  : 'bg-white border border-bone-100 shadow-sm'}`}>
                <div className="flex gap-0.5 mb-4 sm:mb-5">
                  {[1,2,3,4,5].map(i => <StarIcon key={i} className={`w-4 h-4 ${t.featured ? 'text-bone-200' : 'text-amber-400'}`} />)}
                </div>
                <svg className={`w-7 h-7 sm:w-8 sm:h-8 mb-3 ${t.featured ? 'text-white/20' : 'text-bone-200'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className={`leading-relaxed mb-5 sm:mb-7 text-sm flex-1 ${t.featured ? 'text-bone-100' : 'text-khaki-600'}`}>{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${t.featured ? 'bg-white/20 text-white' : 'bg-bone-100 text-bone-700'}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${t.featured ? 'text-white' : 'text-khaki-900'}`}>{t.name}</div>
                    <div className={`text-xs ${t.featured ? 'text-bone-200' : 'text-khaki-400'}`}>{t.service}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rating summary */}
          <div className="reveal bg-white border border-bone-100 rounded-3xl px-5 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 shadow-sm">
            <div className="flex items-center gap-4 sm:gap-5">
              <div>
                <div className="text-4xl sm:text-5xl font-serif font-bold text-bone-600">4.9</div>
                <div className="flex gap-0.5 mt-1.5">
                  {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-4 h-4 text-amber-400" />)}
                </div>
              </div>
              <div className="w-px h-12 sm:h-14 bg-bone-100" />
              <div>
                <p className="text-khaki-900 font-bold text-base sm:text-lg">+340 reseñas verificadas</p>
                <p className="text-khaki-400 text-sm mt-0.5">Google · Facebook · Doctoralia</p>
              </div>
            </div>
            <a href="https://www.instagram.com/velco.oe" target="_blank" rel="noopener"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all shadow-lg shadow-pink-200">
              <IgIcon className="w-4 h-4" />
              Ver casos en Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────── EQUIPO / BOOKING ─────────────── */}
      <section id="equipo" className="py-14 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14 lg:mb-20 reveal">
            <span className="inline-block px-4 py-1.5 bg-bone-100 text-bone-700 text-[11px] font-bold tracking-[0.15em] uppercase rounded-full mb-4 sm:mb-5">Nuestros especialistas</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-khaki-900 mb-4 sm:mb-5">
              Conoce al equipo que<br />
              <span className="italic text-bone-500">cambiará tu sonrisa</span>
            </h2>
            <p className="text-khaki-400 text-base sm:text-lg max-w-xl mx-auto font-light leading-relaxed">
              Especialistas con formación internacional, apasionados por la odontología de excelencia.
              Selecciona a tu profesional y agenda en línea.
            </p>
          </div>

          {loadingStaff ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-bone-400" />
            </div>
          ) : !TENANT_ID ? (
            <div className="text-center py-20 text-khaki-400">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Configura NEXT_PUBLIC_TENANT_ID para ver el equipo</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-20 text-khaki-400">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No hay profesionales registrados aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {staff.map(member => (
                <StaffCard key={member.id} member={member} onViewCalendar={() => setCalendarStaff(member)} />
              ))}
            </div>
          )}

          {/* CTA strip */}
          <div className="mt-10 sm:mt-14 lg:mt-16 bg-gradient-to-r from-bone-500 to-bone-700 rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 reveal shadow-xl shadow-bone-300/30">
            <div className="text-center md:text-left">
              <h3 className="font-serif font-bold text-white text-xl sm:text-2xl mb-2">¿No sabes qué tratamiento necesitas?</h3>
              <p className="text-bone-100/80 font-light text-sm sm:text-base">Agenda una consulta diagnóstica gratuita y nuestros especialistas te orientarán.</p>
            </div>
            <a href="#equipo" className="w-full md:w-auto text-center px-8 py-4 bg-white text-bone-700 font-bold rounded-2xl hover:bg-bone-50 transition-all shadow-lg hover:shadow-xl text-sm whitespace-nowrap">
              Consulta gratuita →
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────── INSTAGRAM / CONTACTO ─────────────── */}
      <section id="contacto" className="py-14 sm:py-20 lg:py-28 bg-khaki-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-bone-600/8 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-bone-500/8 -translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative reveal">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl shadow-pink-500/30">
            <IgIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <span className="inline-block px-4 py-1.5 bg-bone-500/20 text-bone-300 text-[11px] font-bold tracking-[0.15em] uppercase rounded-full mb-4 sm:mb-6">Síguenos</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-3 sm:mb-4">@velco.oe</h2>
          <p className="text-bone-300 text-base sm:text-xl mb-6 sm:mb-8 font-light leading-relaxed">
            Descubre transformaciones reales, consejos de salud dental y las últimas novedades en tratamientos.
            Escríbenos por DM para consultas rápidas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-7 sm:mb-10 text-sm text-bone-400">
            <span className="flex items-center gap-2 text-center sm:text-left">
              <svg className="w-4 h-4 text-bone-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Av. Mario Urteaga 218, Int C4 — Cajamarca
            </span>
            <span className="hidden sm:block w-1 h-1 rounded-full bg-bone-700" />
            <a href="https://wa.me/51976255210" target="_blank" rel="noopener"
              className="flex items-center gap-2 hover:text-bone-300 transition-colors">
              <WaIcon className="w-4 h-4 text-bone-500" />
              +51 976 255 210
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a href="https://www.instagram.com/velco.oe" target="_blank" rel="noopener"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white font-semibold rounded-full transition-all shadow-xl shadow-pink-500/30 text-base">
              <IgIcon className="w-5 h-5" />
              Seguir en Instagram
            </a>
            <a href="https://wa.me/51976255210" target="_blank" rel="noopener"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold rounded-full transition-all backdrop-blur-sm text-base">
              <WaIcon className="w-5 h-5" />
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="bg-khaki-950 pt-12 sm:pt-16 lg:pt-20 pb-24 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 lg:gap-12 pb-10 sm:pb-14 border-b border-khaki-800">
            {/* Brand */}
            <div className="col-span-2">
              <img src="/velco-logo.png" alt="Velco" className="h-9 sm:h-11 w-auto opacity-80 hover:opacity-100 transition-opacity mb-4 sm:mb-5" />
              <p className="text-sm text-bone-600 leading-relaxed max-w-xs mb-5 sm:mb-6 font-light">
                Odontología de alta especialidad en Cajamarca. Más de 10 años transformando sonrisas con tecnología de vanguardia y atención personalizada.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/velco.oe" target="_blank" rel="noopener"
                  className="w-9 h-9 rounded-xl bg-khaki-800 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 flex items-center justify-center transition-all text-bone-500 hover:text-white">
                  <IgIcon className="w-4 h-4" />
                </a>
                <a href="https://wa.me/51976255210" target="_blank" rel="noopener"
                  className="w-9 h-9 rounded-xl bg-khaki-800 hover:bg-emerald-600 flex items-center justify-center transition-all text-bone-500 hover:text-white">
                  <WaIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Tratamientos */}
            <div>
              <div className="text-[11px] font-bold text-bone-500 tracking-[0.15em] uppercase mb-4 sm:mb-5">Tratamientos</div>
              <div className="space-y-2 sm:space-y-2.5">
                {['Diseño de sonrisa', 'Implantes dentales', 'Ortodoncia invisible', 'Blanqueamiento', 'Odontología general', 'Odontopediatría'].map(s => (
                  <a key={s} href="#servicios" className="block text-sm text-bone-700 hover:text-bone-300 transition-colors">{s}</a>
                ))}
              </div>
            </div>

            {/* Clínica */}
            <div>
              <div className="text-[11px] font-bold text-bone-500 tracking-[0.15em] uppercase mb-4 sm:mb-5">Clínica</div>
              <div className="space-y-2 sm:space-y-2.5">
                {[
                  { href: '#nosotros', label: 'Quiénes somos' },
                  { href: '#resultados', label: 'Casos de éxito' },
                  { href: '#equipo', label: 'Nuestro equipo' },
                  { href: '#equipo', label: 'Agendar cita' },
                  { href: '#contacto', label: 'Contacto' },
                ].map(({ href, label }) => (
                  <a key={label} href={href} className="block text-sm text-bone-700 hover:text-bone-300 transition-colors">{label}</a>
                ))}
              </div>
            </div>

            {/* Contacto — full width on mobile */}
            <div className="col-span-2 md:col-span-1">
              <div className="text-[11px] font-bold text-bone-500 tracking-[0.15em] uppercase mb-4 sm:mb-5">Contacto</div>
              <div className="space-y-3 text-sm text-bone-700">
                <p className="leading-relaxed">Av. Mario Urteaga 218, Int C4<br />Cajamarca, Perú</p>
                <a href="https://wa.me/51976255210" className="flex items-center gap-2 hover:text-bone-400 transition-colors">
                  <WaIcon className="w-4 h-4 text-bone-600 flex-shrink-0" />
                  +51 976 255 210
                </a>
                <a href="https://www.instagram.com/velco.oe" target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-bone-400 transition-colors">
                  <IgIcon className="w-4 h-4 text-bone-600 flex-shrink-0" />
                  @velco.oe
                </a>
                <div className="pt-1">
                  <p className="text-bone-600 text-xs font-medium">Horario de atención</p>
                  <p className="text-bone-700 text-xs mt-0.5">Lun – Vie: 8:00 am – 7:00 pm</p>
                  <p className="text-bone-700 text-xs">Sábados: 8:00 am – 2:00 pm</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 pt-6 sm:pt-8">
            <span className="text-xs text-bone-800 text-center sm:text-left">© {new Date().getFullYear()} Velco Odontología Especializada — Todos los derechos reservados.</span>
            <span className="text-xs text-bone-800">Hecho con dedicación en Cajamarca 🇵🇪</span>
          </div>
        </div>
      </footer>

      {/* ─────────────── FLOATING MOBILE CTA ─────────────── */}
      {scrolled && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 bg-white/96 backdrop-blur-md border-t border-bone-100 shadow-xl shadow-bone-900/10">
          <a href="#equipo"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-bone-500 hover:bg-bone-600 text-white font-semibold rounded-2xl text-sm transition-all shadow-md shadow-bone-900/20 active:scale-[0.98]">
            <Calendar className="w-4 h-4" />
            Reservar cita gratis
          </a>
        </div>
      )}

      {/* ── Modales ── */}
      {calendarStaff && (
        <CalendarModal
          staff={calendarStaff}
          onSelectDate={(date) => { setSelectedDate(date); setCalendarStaff(null); setBookingStaff(calendarStaff); }}
          onClose={() => setCalendarStaff(null)}
        />
      )}
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
