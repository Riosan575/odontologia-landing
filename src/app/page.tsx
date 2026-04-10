'use client';

import { useEffect, useState } from 'react';
import {
  Calendar, Clock, Phone, Star, CheckCircle,
  Loader2, Shield, Award, Smile,
} from 'lucide-react';
import {
  fetchStaff, formatSchedule,
  TENANT_ID, type PublicStaff,
} from '@/lib/api';

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

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({ member }: { member: PublicStaff }) {
  const today = new Date().toISOString().split('T')[0];
  const upcoming = member.schedule
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

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
      <div className="border-t border-slate-50 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Próximos horarios</p>
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-400">Sin horarios próximos registrados</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((s, i) => {
              const d = new Date(s.date + 'T12:00:00');
              const label = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg">
                  <span className="text-xs font-semibold text-slate-700 capitalize">{label}</span>
                  <span className="text-xs text-slate-500">{s.startTime} – {s.endTime}</span>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">{formatSchedule(member.schedule)}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [staff, setStaff] = useState<PublicStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

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
              Conoce a nuestros especialistas y sus horarios de atención.
              Diagnóstico personalizado, tecnología de punta y atención cálida para toda la familia.
            </p>

            {/* Trust badges */}
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
                <StaffCard key={member.id} member={member} />
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
    </>
  );
}
