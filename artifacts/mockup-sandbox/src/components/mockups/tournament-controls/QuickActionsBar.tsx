import './_group.css';
import {
  Home, Link as LinkIcon, FileText, Users, ShieldCheck, UserPlus, Download,
  Megaphone, Activity, FileSpreadsheet, Settings as SettingsIcon, Palette,
  Flag, Trash2, MoreHorizontal, Sparkles, ChevronLeft,
} from 'lucide-react';

const CYAN = '#4ECDC4';
const PURPLE = '#7B5EA7';
const SUCCESS = '#34C759';
const GOLD = '#FFC107';
const DANGER = '#DC2626';

export function QuickActionsBar() {
  return (
    <div className="tcv-root">
      {/* Header */}
      <div style={{ position: 'relative', padding: '20px 16px 14px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, right: '35%', background: CYAN }} />
        <div style={{ position: 'absolute', inset: 0, left: '65%', background: PURPLE }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button style={iconBtn}><Home size={16} color="#fff" /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>بطولة الخليج للمناظرات</div>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11 }}>16 فريق · الجولة 3/5</div>
          </div>
          <button style={iconBtn}><MoreHorizontal size={16} color="#fff" /></button>
        </div>
        {/* Tabs */}
        <div style={{
          position: 'relative', display: 'flex', gap: 4, padding: 4,
          background: 'rgba(255,255,255,.18)', borderRadius: 12,
        }}>
          {['الجولات','الترتيب','المتحدثين','المحكمون'].map((t,i) => (
            <div key={t} style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, textAlign: 'center', fontSize: 11.5,
              fontWeight: 700,
              background: i === 0 ? '#fff' : 'transparent',
              color: i === 0 ? PURPLE : 'rgba(255,255,255,.85)',
            }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Round controls — quick action toolbar */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 18, padding: 12, boxShadow: '0 6px 18px -10px rgba(15,23,42,.15)',
          border: '1px solid rgba(15,23,42,.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              padding: '3px 9px', borderRadius: 8, background: PURPLE + '14',
              color: PURPLE, fontWeight: 800, fontSize: 11,
            }}>الجولة 3</div>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>4 قاعات · 0/4 مكتمل</div>
          </div>

          {/* Big primary action */}
          <button style={{
            width: '100%', padding: '13px 14px', borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg, ${PURPLE}, #5B428A)`, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
            boxShadow: '0 6px 14px -6px rgba(123,94,167,.55)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LinkIcon size={16} color="#fff" />
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: 13.5 }}>إنشاء رابط المحكمين</div>
              <div style={{ fontSize: 10, opacity: .85 }}>يفتح مرة واحدة لكل جولة</div>
            </div>
          </button>

          {/* Secondary row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ChipBtn icon={Download} label="لصق نتائج المحكم" color={SUCCESS} />
            <ChipBtn icon={FileText} label="تصدير PDF" color={CYAN} />
          </div>
        </div>

        {/* 3-icon shelf — categorized */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <CategoryCard icon={Activity} label="التقارير" hint="PDF · Excel · إحصاءات" color={CYAN} count={4} />
          <CategoryCard icon={ShieldCheck} label="الروابط" hint="تسجيل · إدارة · رمز" color={PURPLE} count={3} />
          <CategoryCard icon={SettingsIcon} label="الإعدادات" hint="مظهر · مراحل · إنهاء" color="#475569" count={5} />
        </div>

        {/* Example expanded popover for "التقارير" */}
        <div style={{
          marginTop: 14, background: '#fff', borderRadius: 16, padding: 10,
          border: `1px solid ${CYAN}33`, boxShadow: '0 10px 24px -12px rgba(15,23,42,.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: CYAN + '1f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={14} color={CYAN} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 12.5, color: '#0f172a' }}>التقارير والإحصاءات</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>اختر ما تحتاج تنزيله أو عرضه</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <PopRow icon={FileText} label="تقرير PDF" color={PURPLE} />
            <PopRow icon={FileSpreadsheet} label="ملف Excel" color={SUCCESS} />
            <PopRow icon={Activity} label="لوحة الإحصاءات" color={CYAN} />
            <PopRow icon={Megaphone} label="إعلان النتائج" color={PURPLE} />
          </div>
        </div>

        {/* Mini hint */}
        <div style={{
          marginTop: 12, padding: '10px 12px', background: '#fff', borderRadius: 14,
          border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Sparkles size={14} color={GOLD} />
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
            القائمة الرئيسية أصبحت صغيرة — كل صنف في مكانه الواضح
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipBtn({ icon: Icon, label, color }: { icon: typeof Home; label: string; color: string }) {
  return (
    <button style={{
      padding: '11px 8px', borderRadius: 12, border: `1px solid ${color}55`,
      background: color + '14', color, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontWeight: 700, fontSize: 12,
    }}>
      <Icon size={14} />
      {label}
    </button>
  );
}

function CategoryCard({
  icon: Icon, label, hint, color, count,
}: { icon: typeof Home; label: string; hint: string; color: string; count: number }) {
  return (
    <button style={{
      padding: '12px 10px', borderRadius: 14, border: '1px solid rgba(15,23,42,.06)',
      background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', gap: 6, position: 'relative',
      boxShadow: '0 4px 10px -8px rgba(15,23,42,.15)',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9, background: color + '14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 12, color: '#0f172a' }}>{label}</div>
      <div style={{ fontSize: 9.5, color: '#94a3b8', textAlign: 'right' }}>{hint}</div>
      <span style={{
        position: 'absolute', top: 8, left: 8, padding: '1px 6px', borderRadius: 999,
        background: color + '1a', color, fontSize: 9.5, fontWeight: 800,
      }}>{count}</span>
    </button>
  );
}

function PopRow({ icon: Icon, label, color }: { icon: typeof Home; label: string; color: string }) {
  return (
    <button style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
      borderRadius: 10, background: '#f8fafc', border: '1px solid rgba(15,23,42,.05)',
      cursor: 'pointer', textAlign: 'right',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 7, background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}><Icon size={12} color={color} /></div>
      <div style={{ flex: 1, fontWeight: 700, fontSize: 11.5, color: '#0f172a' }}>{label}</div>
      <ChevronLeft size={11} color="#cbd5e1" />
    </button>
  );
}

const iconBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.22)',
  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
