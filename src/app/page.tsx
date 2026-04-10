'use client';

import { useEffect, useState } from 'react';
import {
  Calendar, Clock, Phone, Star, CheckCircle, ArrowRight,
  X, ChevronDown, Loader2, User, CreditCard, MessageSquare,
  Smile, Shield, Award,
} from 'lucide-react';
import {
  fetchStaff, createConsulta, formatSchedule,
  TENANT_ID, type PublicStaff,
} from '@/lib/api';

// ─── Day map ──────────────────────────────────────────────────────────────────
const DAY_LABELS: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

// ─── Staff Avatar ─────────────────────────────────────────────────────────────
function Avatar({ staff, size = 'md' }: { staff: PublicStaff; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-24 h-24 text-3xl' : size === 'md' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
  if (staff.avatar) {
    return <img src={staff.avatar} alt={staff.fullName} className={`${dim} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: staff.color || '#1976D2' }}
    >
      {staff.fullName.charAt(0)}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function BookingModal({
  staff,
  preselected,
  onClose,
}: {
  staff: PublicStaff[];
  preselected: PublicStaff | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [selectedStaff, setSelectedStaff] = useState<PublicStaff | null>(preselected);
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [firstVisit, setFirstVisit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputCls = 'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dni.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createConsulta({
        tenantId: TENANT_ID,
        fullName: name.trim(),
        dni: dni.trim(),
        phone: phone.trim() || undefined,
        staffId: selectedStaff?.id,
        isFirstVisit: firstVisit,
        notes: reason.trim() || undefined,
      });
      setStep('success');
    } catch {
      setError('Ocurrió un error al procesar tu solicitud. Por favor inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Reservar consulta</h2>
            <p className="text-sm text-slate-500 mt-0.5">Sin costo · Confirmamos tu turno</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {step === 'success' ? (
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-teal-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Consulta registrada!</h3>
            <p className="text-slate-500 mb-1">
              Hola <span className="font-semibold text-slate-700">{name}</span>, tu consulta ha sido registrada exitosamente.
            </p>
            {selectedStaff && (
              <p className="text-sm text-slate-500 mb-6">
                Te atenderá <span className="font-medium text-teal-600">{selectedStaff.fullName}</span>
              </p>
            )}
            <div className="bg-teal-50 rounded-2xl p-4 text-sm text-teal-700 mb-6">
              Preséntate en la clínica con tu DNI. El odontólogo te atenderá en orden de llegada.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Professional selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Odontólogo de preferencia
              </label>
              <div className="relative">
                <select
                  value={selectedStaff?.id ?? ''}
                  onChange={e => setSelectedStaff(staff.find(s => s.id === e.target.value) ?? null)}
                  className={inputCls + ' appearance-none pr-10'}
                >
                  <option value="">Sin preferencia</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName}{s.specialization ? ` — ${s.specialization}` : ''}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {selectedStaff && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Avatar staff={selectedStaff} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{selectedStaff.fullName}</p>
                    <p className="text-xs text-slate-500">{formatSchedule(selectedStaff.schedule)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Juan Pérez García"
                  className={inputCls + ' pl-10'}
                />
              </div>
            </div>

            {/* DNI + Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  DNI <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required value={dni} onChange={e => setDni(e.target.value)}
                    placeholder="12345678"
                    className={inputCls + ' pl-10'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+51 999..."
                    className={inputCls + ' pl-10'}
                  />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Motivo de la consulta</label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  value={reason} onChange={e => setReason(e.target.value)}
                  rows={2} placeholder="Dolor de muela, revisión general, limpieza..."
                  className={inputCls + ' pl-10 resize-none'}
                />
              </div>
            </div>

            {/* First visit */}
            <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100 cursor-pointer">
              <input
                type="checkbox" checked={firstVisit} onChange={e => setFirstVisit(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-600"
              />
              <div>
                <p className="text-sm font-semibold text-purple-800">Primera vez en la clínica</p>
                <p className="text-xs text-purple-600">Prepararemos tu ficha clínica completa</p>
              </div>
            </label>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !dni.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-500 text-white rounded-xl font-semibold text-sm hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Procesando...</>
                : <><Calendar className="w-4 h-4" />Confirmar consulta</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({ member, onBook }: { member: PublicStaff; onBook: (s: PublicStaff) => void }) {
  const activeDays = member.schedule.filter(d => d.isActive);
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

      {/* Schedule */}
      {activeDays.length > 0 && (
        <div className="border-t border-slate-50 pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Horario de atención</p>
          <div className="flex flex-wrap gap-2">
            {activeDays.map(d => (
              <div key={d.dayOfWeek} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg">
                <span className="text-xs font-semibold text-slate-700">{DAY_LABELS[d.dayOfWeek]}</span>
                <span className="text-xs text-slate-400">{d.startTime}–{d.endTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onBook(member)}
        className="mt-auto flex items-center justify-center gap-2 py-3 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        Reservar con {member.fullName.split(' ')[0]}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [staff, setStaff] = useState<PublicStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [preselected, setPreselected] = useState<PublicStaff | null>(null);

  useEffect(() => {
    if (!TENANT_ID) { setLoadingStaff(false); return; }
    fetchStaff()
      .then(setStaff)
      .catch(() => {})
      .finally(() => setLoadingStaff(false));
  }, []);

  const openBooking = (member?: PublicStaff) => {
    setPreselected(member ?? null);
    setShowModal(true);
  };

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
          <button
            onClick={() => openBooking()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Reservar
          </button>
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
              Agenda tu consulta con nuestros especialistas. Diagnóstico personalizado,
              tecnología de punta y atención cálida para toda la familia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => openBooking()}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-teal-500 text-white rounded-2xl text-base font-bold hover:bg-teal-600 transition-all hover:scale-105 shadow-lg shadow-teal-200"
              >
                <Calendar className="w-5 h-5" />
                Reservar consulta gratis
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#equipo"
                className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl text-base font-semibold hover:border-teal-300 hover:text-teal-600 transition-colors"
              >
                Conocer al equipo
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-12 text-sm text-slate-500">
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
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-teal-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Cargando equipo...</p>
              </div>
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
                <StaffCard key={member.id} member={member} onBook={openBooking} />
              ))}
            </div>
          )}

          {staff.length > 0 && (
            <div className="mt-10 text-center">
              <button
                onClick={() => openBooking()}
                className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-white rounded-2xl font-bold hover:bg-teal-600 transition-all hover:scale-105 shadow-lg shadow-teal-200"
              >
                <Calendar className="w-5 h-5" />
                Reservar mi consulta ahora
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="py-16 bg-teal-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            ¿Listo para tener la sonrisa que mereces?
          </h2>
          <p className="text-teal-100 text-lg mb-8">
            Reserva tu consulta hoy. Sin costo y sin compromiso.
          </p>
          <button
            onClick={() => openBooking()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 rounded-2xl font-bold hover:bg-teal-50 transition-colors text-base"
          >
            <Calendar className="w-5 h-5" />
            Reservar consulta gratis
            <ArrowRight className="w-4 h-4" />
          </button>
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
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-xs">
            © {new Date().getFullYear()} DentalPro. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* ── Booking Modal ── */}
      {showModal && (
        <BookingModal
          staff={staff}
          preselected={preselected}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
