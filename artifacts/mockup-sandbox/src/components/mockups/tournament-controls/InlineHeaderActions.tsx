import './_group.css';
import {
  Home, Link as LinkIcon, FileText, Activity, ShieldCheck, UserPlus, Download,
  Megaphone, Settings as SettingsIcon, Palette, Flag, Trash2, MoreHorizontal,
  ChevronLeft, FileSpreadsheet, Sparkles,
} from 'lucide-react';

const CYAN = '#4ECDC4';
const PURPLE = '#7B5EA7';
const SUCCESS = '#34C759';
const GOLD = '#FFC107';
const DANGER = '#DC2626';

export function InlineHeaderActions() {
  return (
    <div className="tcv-root">
      {/* Header with labeled action chips */}
      <div style={{ position: 'relative', padding: '20px 16px 14px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, right: '35%', background: CYAN }} />
        <div style={{ position: 'absolute', inset: 0, left: '65%', background: PURPLE }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button style={iconBtn}><Home size={16} color="#fff" /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>بطولة الخليج للمناظرات</div>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11 }}>16 فريق · الجولة 3/5</div>
          </div>
        </div>

        {/* Header chip row */}
        <div style={{ position: 'relative', display: 'flex', gap: 6 }}>
          <HeaderChip icon={Activity} label="إحصاءات" />
          <HeaderChip icon={FileText} label="تقارير" />
          <HeaderChip icon={ShieldCheck} label="روابط" />
          <button style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,.22)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MoreHorizontal size={16} color="#fff" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 14px' }}>
        <div style={{
          display: 'flex', gap: 4, padding: 4, background: '#fff', borderRadius: 12,
          boxShadow: '0 2px 6px -2px rgba(15,23,42,.1)', border: '1px solid rgba(15,23,42,.05)',
        }}>
          {['الجولات','الترتيب','المتحدثين','المحكمون'].map((t,i) => (
            <div key={t} style={{
              flex: 1, padding: '7px 4px', borderRadius: 8, textAlign: 'center',
              fontSize: 11.5, fontWeight: 700,
              background: i === 0 ? PURPLE : 'transparent',
              color: i === 0 ? '#fff' : '#475569',
            }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Round area */}
      <div style={{ padding: '14px 14px 0' }}>
        {/* Quick actions row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 8, marginBottom: 12 }}>
          <button style={{
            padding: '14px 12px', borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg, ${PURPLE}, #5B428A)`, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            boxShadow: '0 6px 14px -8px rgba(123,94,167,.5)',
          }}>
            <LinkIcon size={16} />
            <span style={{ fontWeight: 800, fontSize: 13 }}>رابط المحكمين</span>
          </button>
          <button style={{
            padding: '14px 12px', borderRadius: 14, border: `1px solid ${SUCCESS}55`,
            background: SUCCESS + '14', color: SUCCESS, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Download size={14} />
            <span style={{ fontWeight: 700, fontSize: 12 }}>لصق نتائج</span>
          </button>
        </div>

        {/* Roomy match cards preview */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 10,
          border: '1px solid rgba(15,23,42,.06)', marginBottom: 14,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 6px 10px',
          }}>
            <div style={{ fontWeight: 800, fontSize: 12.5, color: '#0f172a' }}>الجولة 3 — قاعات المباريات</div>
            <span style={{
              fontSize: 10, fontWeight: 700, color: PURPLE,
              background: PURPLE + '14', padding: '2px 7px', borderRadius: 8,
            }}>4 قاعات</span>
          </div>
          {[1,2,3].map((n) => (
            <div key={n} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px',
              borderRadius: 10, background: '#f8fafc', marginBottom: 6,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, background: PURPLE + '14',
                color: PURPLE, fontWeight: 800, fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{n}</div>
              <div style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                فريق {n}أ ضد فريق {n}ب
              </div>
              <ChevronLeft size={12} color="#cbd5e1" />
            </div>
          ))}
        </div>

        {/* Expanded "More" menu (the small one) */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 10,
          border: '1px solid rgba(15,23,42,.06)',
          boxShadow: '0 10px 22px -14px rgba(15,23,42,.2)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 8px',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MoreHorizontal size={14} color="#475569" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 12.5, color: '#0f172a' }}>قائمة "المزيد"</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>إجراءات متقدمة فقط</div>
            </div>
          </div>
          <MoreRow icon={Palette} label="مظهر التطبيق" color={CYAN} hint="فاتح / داكن / تلقائي" />
          <MoreRow icon={Sparkles} label="نصف النهائي" color={GOLD} hint="غير مفعّل" />
          <MoreRow icon={Sparkles} label="النهائي" color={GOLD} hint="غير مفعّل" />
          <Divider />
          <MoreRow icon={Flag} label="إنهاء البطولة" color={GOLD} />
          <MoreRow icon={Trash2} label="حذف البطولة" color={DANGER} />
        </div>
      </div>
    </div>
  );
}

function HeaderChip({ icon: Icon, label }: { icon: typeof Home; label: string }) {
  return (
    <button style={{
      flex: 1, height: 36, borderRadius: 10, border: 'none',
      background: 'rgba(255,255,255,.22)', color: '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontWeight: 700, fontSize: 11.5,
    }}>
      <Icon size={13} />
      {label}
    </button>
  );
}

function MoreRow({ icon: Icon, label, color, hint }: { icon: typeof Home; label: string; color: string; hint?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px',
      borderRadius: 10, cursor: 'pointer',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: color + '14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon size={13} color={color} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: color === DANGER ? DANGER : '#0f172a' }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: '#94a3b8' }}>{hint}</div>}
      </div>
      <ChevronLeft size={12} color="#cbd5e1" />
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(15,23,42,.06)', margin: '4px 6px' }} />;
}

const iconBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.22)',
  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
