import './_group.css';
import {
  Home, Settings as SettingsIcon, Link as LinkIcon, FileText, FileSpreadsheet,
  Megaphone, Activity, Users, UserPlus, ShieldCheck, Download, Palette,
  Flag, Trash2, X, ChevronLeft, Sparkles,
} from 'lucide-react';

const CYAN = '#4ECDC4';
const PURPLE = '#7B5EA7';
const SUCCESS = '#34C759';
const GOLD = '#FFC107';
const DANGER = '#DC2626';

interface ActionItem {
  icon: typeof Home;
  label: string;
  hint?: string;
  color: string;
}
interface Section {
  id: string;
  title: string;
  subtitle?: string;
  items: ActionItem[];
}

const sections: Section[] = [
  {
    id: 'reports',
    title: 'التقارير والإحصاءات',
    items: [
      { icon: FileText, label: 'تنزيل تقرير PDF', hint: 'كامل النتائج', color: PURPLE },
      { icon: FileSpreadsheet, label: 'تنزيل ملف Excel', hint: 'بيانات مفصّلة', color: SUCCESS },
      { icon: Activity, label: 'إحصائيات شاملة', hint: 'لوحة الأداء', color: CYAN },
      { icon: Megaphone, label: 'إعلان النتائج', hint: 'صفحة تشاركها', color: PURPLE },
    ],
  },
  {
    id: 'sharing',
    title: 'المشاركة والروابط',
    items: [
      { icon: UserPlus, label: 'رابط تسجيل الفرق', hint: 'يفتح للجمهور', color: CYAN },
      { icon: Download, label: 'استلام تسجيل فريق برمز', color: PURPLE },
      { icon: ShieldCheck, label: 'رابط الإدارة (تحكم كامل)', hint: 'محمي', color: PURPLE },
    ],
  },
  {
    id: 'manage',
    title: 'إدارة البطولة',
    items: [
      { icon: Users, label: 'إدارة الفرق', color: CYAN },
      { icon: Sparkles, label: 'تفعيل نصف النهائي', color: GOLD },
      { icon: Sparkles, label: 'تفعيل النهائي', color: GOLD },
      { icon: Palette, label: 'مظهر التطبيق', hint: 'فاتح / داكن', color: CYAN },
    ],
  },
  {
    id: 'danger',
    title: 'منطقة الخطر',
    subtitle: 'إجراءات لا يمكن التراجع عنها',
    items: [
      { icon: Flag, label: 'إنهاء البطولة', color: GOLD },
      { icon: Trash2, label: 'حذف البطولة', color: DANGER },
    ],
  },
];

export function OrganizedSettings() {
  return (
    <div className="tcv-root">
      {/* Hero header — same as real app */}
      <div style={{ position: 'relative', padding: '20px 16px 12px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, right: '35%', background: CYAN }} />
        <div style={{ position: 'absolute', inset: 0, left: '65%', background: PURPLE }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button style={iconBtn}><Home size={16} color="#fff" /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>بطولة الخليج للمناظرات</div>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11 }}>16 فريق · الجولة 3/5</div>
          </div>
          <button style={{ ...iconBtn, position: 'relative' }}>
            <SettingsIcon size={16} color="#fff" />
            <span style={{
              position: 'absolute', top: -4, right: -4, background: GOLD, color: '#000',
              fontSize: 9, fontWeight: 800, borderRadius: 999, padding: '1px 5px',
            }}>5</span>
          </button>
        </div>
      </div>

      {/* Translucent overlay simulating sheet */}
      <div style={{ position: 'relative', padding: '8px 12px 24px' }}>
        <div style={{
          background: '#fff', borderRadius: 18, boxShadow: '0 12px 32px -10px rgba(15,23,42,.18)',
          overflow: 'hidden', border: '1px solid rgba(15,23,42,.06)',
        }}>
          {/* Sheet header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid rgba(15,23,42,.06)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: PURPLE + '1f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SettingsIcon size={16} color={PURPLE} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>الإعدادات والإجراءات</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>كل ما تحتاجه في مكان واحد</div>
            </div>
            <button style={closeBtn}><X size={14} color="#64748b" /></button>
          </div>

          {/* Pinned primary action */}
          <div style={{ padding: '12px 12px 4px' }}>
            <button style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 14px', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`, color: '#fff', cursor: 'pointer',
              boxShadow: '0 8px 18px -8px rgba(123,94,167,.5)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LinkIcon size={18} color="#fff" />
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>توليد رابط المحكمين</div>
                <div style={{ fontSize: 10.5, opacity: .9 }}>للجولة الحالية · 4 قاعات</div>
              </div>
              <ChevronLeft size={18} color="#fff" />
            </button>
          </div>

          {/* Sections */}
          <div style={{ padding: '8px 0 12px' }}>
            {sections.map((sec) => (
              <div key={sec.id} style={{ padding: '10px 6px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 12px 6px',
                }}>
                  <div style={{ fontWeight: 800, fontSize: 11.5, color: sec.id === 'danger' ? DANGER : '#475569', letterSpacing: .2 }}>
                    {sec.title}
                  </div>
                  {sec.subtitle && (
                    <div style={{ fontSize: 9.5, color: '#94a3b8' }}>{sec.subtitle}</div>
                  )}
                </div>
                <div style={{
                  margin: '0 8px', borderRadius: 12,
                  background: sec.id === 'danger' ? DANGER + '0a' : '#f8fafc',
                  border: `1px solid ${sec.id === 'danger' ? DANGER + '22' : 'rgba(15,23,42,.05)'}`,
                  overflow: 'hidden',
                }}>
                  {sec.items.map((it, i) => {
                    const Icon = it.icon;
                    const isLast = i === sec.items.length - 1;
                    return (
                      <button key={i} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 12px', background: 'transparent', border: 'none',
                        borderBottom: isLast ? 'none' : `1px solid ${sec.id === 'danger' ? DANGER + '14' : 'rgba(15,23,42,.05)'}`,
                        cursor: 'pointer', textAlign: 'right',
                      }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: it.color + (sec.id === 'danger' ? '1a' : '14'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon size={15} color={it.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: 12.5,
                            color: sec.id === 'danger' && it.color === DANGER ? DANGER : '#0f172a',
                          }}>{it.label}</div>
                          {it.hint && <div style={{ fontSize: 10, color: '#94a3b8' }}>{it.hint}</div>}
                        </div>
                        <ChevronLeft size={14} color="#cbd5e1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.22)',
  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
const closeBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, background: '#f1f5f9',
  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
