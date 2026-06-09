import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { CheckCircle, AlertCircle, RotateCcw, UserCheck, SkipForward, ClipboardList } from 'lucide-react';

const QC_REJECT_OPTIONS = [
  { value: 'Repair',          color: '#3B6D11', bg: '#EAF3DE', border: '#97C459' },
  { value: 'ASAP(Same day)',  color: '#854F0B', bg: '#FAEEDA', border: '#EF9F27' },
  { value: 'Next Day',        color: '#185FA5', bg: '#E6F1FB', border: '#85B7EB' },
  { value: 'Remake',          color: '#A32D2D', bg: '#FCEBEB', border: '#F09595' },
  { value: 'Internal Remake', color: '#534AB7', bg: '#EEEDFE', border: '#AFA9EC' },
];

const REJECT_TYPES = [
  'Shade / Color', 'Contour / Anatomy', 'Occlusion / Bite', 'Fit / Adaptation',
  'Surface Finish', 'Fracture / Crack', 'Clasp Issue', 'Tooth Position',
  'Wrong Product', 'Missing Item', 'Rx Not Followed', 'Acrylic Defect',
  'Framework Issue', 'Polymerization Defect', 'Other',
];

const DEPARTMENTS = [
  'Case Entry', 'Scanning', 'Wax-Up / Design', 'Flask / Process',
  'Finish / Polish', 'Solder', 'QC', 'Scheduling', 'Other',
];

const inputSt = { width:'100%', boxSizing:'border-box', border:'1.5px solid #e2e2e2', borderRadius:12, padding:'14px 16px', fontSize:15, background:'#fff', color:'#111', outline:'none', fontFamily:'inherit' };
const labelSt = { display:'block', fontSize:13, fontWeight:600, color:'#555', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' };

const EMPTY = { case_number:'', team:'', technician:'', qc_reject:'ASAP(Same day)', reject_type:'', reject_details:'', ship_date:'' };
const EMPTY_IR = { case_number:'', department:'', logged_by:'', ship_date:'', dr_due_date:'', description:'' };

// ── QC Reject Form ─────────────────────────────────────────────────────────
function QCRejectForm() {
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);
  const [teams, setTeams]   = useState([]);
  const [techs, setTechs]   = useState([]);
  const caseRef = useRef(null);

  useEffect(() => { if (step === 1) caseRef.current?.focus(); }, [step]);

  useEffect(() => {
    supabase.from('rem_teams').select('name').eq('active', true).order('sort_order')
      .then(({ data }) => setTeams((data ?? []).map(t => t.name)));
  }, []);

  useEffect(() => {
    if (!form.team) { setTechs([]); return; }
    supabase.from('rem_employees').select('name').eq('active', true).order('name')
      .then(({ data }) => setTechs((data ?? []).map(e => e.name)));
  }, [form.team]);

  const set = (k, v) => {
    if (k === 'team') setForm(p => ({ ...p, team: v, technician: '', reject_type: '' }));
    else setForm(p => ({ ...p, [k]: v }));
  };

  const canNext   = form.case_number.trim() && form.team && form.technician;
  const canSubmit = canNext && form.reject_type;
  const selectedReject = QC_REJECT_OPTIONS.find(o => o.value === form.qc_reject) || QC_REJECT_OPTIONS[0];

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true); setError(null);
    try {
      const { error: err } = await supabase.from('rem_qc_logs').insert([{
        case_number:    form.case_number.trim(),
        team:           form.team,
        technician:     form.technician,
        qc_reject:      form.qc_reject,
        reject_type:    form.reject_type,
        reject_details: form.reject_details || null,
        ship_date:      form.ship_date || null,
        time_stamp:     new Date().toISOString(),
        created_date:   new Date().toISOString(),
      }]);
      if (err) throw err;
      setStep(3);
    } catch (e) { setError(e.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const reset = () => { setForm(EMPTY); setStep(1); setError(null); };

  if (step === 3) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:24, textAlign:'center' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#EAF3DE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <CheckCircle size={32} color="#3B6D11" />
        </div>
        <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:700 }}>QC Reject Logged ✓</h2>
        <p style={{ color:'#666', fontSize:14, margin:'0 0 6px' }}>Case <strong>{form.case_number}</strong> · {form.qc_reject}</p>
        <p style={{ color:'#666', fontSize:13, margin:'0 0 24px' }}>{form.reject_type} · {form.technician}</p>
        <button onClick={reset} style={{ background:'#7c3aed', color:'#fff', border:'none', borderRadius:12, padding:'14px 32px', fontSize:15, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
          <RotateCcw size={16} /> Log Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:560, margin:'0 auto', padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:700, margin:'0 0 4px' }}>Log QC Reject</h2>
        <p style={{ color:'#666', fontSize:13, margin:0 }}>Removables Department</p>
      </div>

      {/* Step indicator */}
      <div style={{ display:'flex', gap:8, marginBottom:28 }}>
        {['Case & Tech', 'Defect Detail'].map((label, i) => (
          <div key={i} style={{ flex:1, height:4, borderRadius:4, background: step > i ? '#7c3aed' : '#e5e7eb' }} />
        ))}
      </div>

      {step === 1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <label style={labelSt}>Case Number</label>
            <input ref={caseRef} style={inputSt} value={form.case_number} onChange={e => set('case_number', e.target.value.toUpperCase())} placeholder="e.g. 2026-80160" />
          </div>
          <div>
            <label style={labelSt}>Ship Date (optional)</label>
            <input type="date" style={inputSt} value={form.ship_date} onChange={e => set('ship_date', e.target.value)} />
          </div>
          <div>
            <label style={labelSt}>Team</label>
            <select style={inputSt} value={form.team} onChange={e => set('team', e.target.value)}>
              <option value="">— Select team —</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {form.team && (
            <div>
              <label style={labelSt}>Technician</label>
              {techs.length > 0 ? (
                <select style={inputSt} value={form.technician} onChange={e => set('technician', e.target.value)}>
                  <option value="">— Select technician —</option>
                  {techs.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <input style={inputSt} value={form.technician} onChange={e => set('technician', e.target.value)} placeholder="Enter technician name" />
              )}
            </div>
          )}
          <button onClick={() => setStep(2)} disabled={!canNext} style={{ background: canNext ? '#7c3aed' : '#e5e7eb', color: canNext ? '#fff' : '#999', border:'none', borderRadius:12, padding:'15px 24px', fontSize:15, fontWeight:600, cursor: canNext ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            Next <SkipForward size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <label style={labelSt}>QC Decision</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {QC_REJECT_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, border:`1.5px solid ${form.qc_reject === opt.value ? opt.border : '#e5e7eb'}`, background: form.qc_reject === opt.value ? opt.bg : '#fff', cursor:'pointer' }}>
                  <input type="radio" name="qc_reject" value={opt.value} checked={form.qc_reject === opt.value} onChange={() => set('qc_reject', opt.value)} style={{ accentColor: opt.color }} />
                  <span style={{ fontWeight:600, color: opt.color, fontSize:14 }}>{opt.value}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={labelSt}>Defect Type</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {REJECT_TYPES.map(t => (
                <button key={t} onClick={() => set('reject_type', form.reject_type === t ? '' : t)} style={{ padding:'8px 14px', borderRadius:20, fontSize:13, fontWeight:500, border:`1.5px solid ${form.reject_type === t ? '#7c3aed' : '#e5e7eb'}`, background: form.reject_type === t ? '#ede9fe' : '#fff', color: form.reject_type === t ? '#6d28d9' : '#555', cursor:'pointer' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelSt}>Route Back Department</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {DEPARTMENTS.map(d => (
                <button key={d} onClick={() => set('route_back_dept', form.route_back_dept === d ? '' : d)} style={{ padding:'8px 14px', borderRadius:20, fontSize:13, fontWeight:500, border:`1.5px solid ${form.route_back_dept === d ? '#0ea5e9' : '#e5e7eb'}`, background: form.route_back_dept === d ? '#e0f2fe' : '#fff', color: form.route_back_dept === d ? '#0369a1' : '#555', cursor:'pointer' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelSt}>Notes (optional)</label>
            <textarea style={{ ...inputSt, minHeight:80, resize:'vertical' }} value={form.reject_details} onChange={e => set('reject_details', e.target.value)} placeholder="Additional details about the defect…" />
          </div>

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'12px 16px', display:'flex', gap:10, alignItems:'flex-start', color:'#B91C1C', fontSize:13 }}>
              <AlertCircle size={16} style={{ marginTop:1, flexShrink:0 }} /> {error}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(1)} style={{ flex:1, background:'#f3f4f6', color:'#374151', border:'none', borderRadius:12, padding:'15px 0', fontSize:15, fontWeight:600, cursor:'pointer' }}>Back</button>
            <button onClick={handleSubmit} disabled={!canSubmit || saving} style={{ flex:2, background: canSubmit ? '#7c3aed' : '#e5e7eb', color: canSubmit ? '#fff' : '#999', border:'none', borderRadius:12, padding:'15px 0', fontSize:15, fontWeight:600, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
              {saving ? 'Saving…' : 'Submit QC Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Internal Remake Form ────────────────────────────────────────────────────
function InternalRemakeForm() {
  const [form, setForm]     = useState(EMPTY_IR);
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const canSubmit = form.case_number.trim() && form.department && form.logged_by.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true); setError(null);
    try {
      const { error: err } = await supabase.from('mrb_cases').insert([{
        case_number:   form.case_number.trim(),
        source:        'Internal Remake',
        business_unit: 'Removable',
        team:          form.department,
        logged_by:     form.logged_by.trim(),
        ship_date:     form.ship_date || null,
        dr_due_date:   form.dr_due_date || null,
        defect_description: form.description || null,
        status:        'Open',
        opened_date:   new Date().toISOString().split('T')[0],
        created_date:  new Date().toISOString(),
      }]);
      if (err) throw err;
      setDone(true);
    } catch (e) { setError(e.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  if (done) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:24, textAlign:'center' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#EDE9FE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <CheckCircle size={32} color="#6D28D9" />
        </div>
        <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:700 }}>Internal Remake Logged ✓</h2>
        <p style={{ color:'#666', fontSize:14, margin:'0 0 24px' }}>Case <strong>{form.case_number}</strong></p>
        <button onClick={() => { setForm(EMPTY_IR); setDone(false); }} style={{ background:'#7c3aed', color:'#fff', border:'none', borderRadius:12, padding:'14px 32px', fontSize:15, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
          <RotateCcw size={16} /> Log Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:560, margin:'0 auto', padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:700, margin:'0 0 4px' }}>Log Internal Remake</h2>
        <p style={{ color:'#666', fontSize:13, margin:0 }}>Removables Department</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div>
          <label style={labelSt}>Case Number</label>
          <input style={inputSt} value={form.case_number} onChange={e => set('case_number', e.target.value.toUpperCase())} placeholder="e.g. 2026-80160" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={labelSt}>Ship Date</label>
            <input type="date" style={inputSt} value={form.ship_date} onChange={e => set('ship_date', e.target.value)} />
          </div>
          <div>
            <label style={labelSt}>Dr Due Date</label>
            <input type="date" style={inputSt} value={form.dr_due_date} onChange={e => set('dr_due_date', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelSt}>Department at Fault</label>
          <select style={inputSt} value={form.department} onChange={e => set('department', e.target.value)}>
            <option value="">— Select department —</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Logged By</label>
          <input style={inputSt} value={form.logged_by} onChange={e => set('logged_by', e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label style={labelSt}>Description (optional)</label>
          <textarea style={{ ...inputSt, minHeight:80, resize:'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What went wrong?" />
        </div>
        {error && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'12px 16px', display:'flex', gap:10, alignItems:'flex-start', color:'#B91C1C', fontSize:13 }}>
            <AlertCircle size={16} style={{ marginTop:1, flexShrink:0 }} /> {error}
          </div>
        )}
        <button onClick={handleSubmit} disabled={!canSubmit || saving} style={{ background: canSubmit ? '#7c3aed' : '#e5e7eb', color: canSubmit ? '#fff' : '#999', border:'none', borderRadius:12, padding:'15px 0', fontSize:15, fontWeight:600, cursor: canSubmit ? 'pointer' : 'not-allowed', width:'100%' }}>
          {saving ? 'Saving…' : 'Submit Internal Remake'}
        </button>
      </div>
    </div>
  );
}

// ── Page shell ──────────────────────────────────────────────────────────────
export default function QCLogPage() {
  const [tab, setTab] = useState('qc');
  const tabs = [
    { id: 'qc', label: 'QC Reject', icon: ClipboardList },
    { id: 'ir', label: 'Internal Remake', icon: UserCheck },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, padding:'16px 24px 0', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', border:'none', borderBottom: tab === id ? '2px solid #7c3aed' : '2px solid transparent', background:'none', color: tab === id ? '#7c3aed' : '#6b7280', fontWeight: tab === id ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-1 }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
        {tab === 'qc' ? <QCRejectForm /> : <InternalRemakeForm />}
      </div>
    </div>
  );
}
