import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { CheckCircle, AlertCircle, RotateCcw, Bell } from 'lucide-react';

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

const EMPTY    = { case_number:'', team:'', technician:'', qc_reject:'ASAP(Same day)', reject_type:'', reject_details:'', ship_date:'' };
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
        <p style={{ margin:'0 0 20px', fontSize:14, color:'#555' }}><strong>{form.case_number}</strong> · {form.team} · {form.qc_reject}</p>
        <button onClick={reset} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#1a1a1a', color:'#fff', border:'none', borderRadius:14, padding:'14px 28px', fontSize:15, fontWeight:600, cursor:'pointer', width:'100%', maxWidth:360 }}>
          <RotateCcw size={16} /> Log another case
        </button>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
      <div style={{ display:'flex', gap:6, justifyContent:'flex-end', padding:'8px 0' }}>
        {[1,2,3].map(s => <div key={s} style={{ width: s === step ? 24 : 8, height:8, borderRadius:4, background: step >= s ? '#111' : '#ddd', transition:'all 0.2s' }} />)}
      </div>
      <div style={{ flex:1, paddingBottom:120 }}>
        {error && <div style={{ display:'flex', gap:8, alignItems:'center', background:'#FFF0F0', border:'1px solid #FFC9C9', borderRadius:12, padding:'12px 14px', marginBottom:16, fontSize:14, color:'#C0392B' }}><AlertCircle size={16} />{error}</div>}

        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={labelSt}>Case Number</label>
              <input ref={caseRef} value={form.case_number} onChange={e => set('case_number', e.target.value)} placeholder="e.g. 2026-12345" style={{ ...inputSt, fontSize:18, fontWeight:600 }} onKeyDown={e => e.key === 'Enter' && canNext && setStep(2)} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={labelSt}>Department</label>
                <div style={{ position:'relative' }}>
                  <select value={form.team} onChange={e => set('team', e.target.value)} style={{ ...inputSt, appearance:'none', WebkitAppearance:'none', paddingRight:36, color: form.team ? '#111' : '#999' }}>
                    <option value="">Select dept</option>
                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#999', fontSize:11 }}>▾</span>
                </div>
              </div>
              <div>
                <label style={labelSt}>Technician</label>
                <div style={{ position:'relative' }}>
                  <select value={form.technician} onChange={e => set('technician', e.target.value)} disabled={!form.team} style={{ ...inputSt, appearance:'none', WebkitAppearance:'none', paddingRight:36, color: form.technician ? '#111' : '#999', opacity: !form.team ? 0.5 : 1 }}>
                    <option value="">{form.team ? 'Select tech' : 'Select dept first'}</option>
                    {techs.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#999', fontSize:11 }}>▾</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'#f5f5f5', borderRadius:12, padding:'10px 14px', fontSize:13, color:'#555' }}>
              <strong>{form.case_number}</strong> · {form.team} · {form.technician}
            </div>
            <div>
              <label style={labelSt}>Reject Urgency</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {QC_REJECT_OPTIONS.map(opt => {
                  const active = form.qc_reject === opt.value;
                  return <button key={opt.value} onClick={() => set('qc_reject', opt.value)} style={{ padding:'10px 14px', fontSize:13, fontWeight: active ? 700 : 400, borderRadius:99, cursor:'pointer', border:'none', background: active ? opt.bg : '#f0f0f0', color: active ? opt.color : '#666', outline: active ? `2px solid ${opt.border}` : 'none', outlineOffset:1, transition:'all 0.15s' }}>{opt.value}</button>;
                })}
              </div>
            </div>
            <div>
              <label style={labelSt}>Reject Type</label>
              <div style={{ position:'relative' }}>
                <select value={form.reject_type} onChange={e => set('reject_type', e.target.value)} style={{ ...inputSt, appearance:'none', WebkitAppearance:'none', paddingRight:36, color: form.reject_type ? '#111' : '#999' }}>
                  <option value="">Select reject type</option>
                  {REJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#999', fontSize:11 }}>▾</span>
              </div>
            </div>
            <div>
              <label style={labelSt}>Details <span style={{ fontWeight:400, color:'#aaa', textTransform:'none' }}>(optional)</span></label>
              <textarea value={form.reject_details} onChange={e => set('reject_details', e.target.value)} placeholder="Describe the issue…" rows={3} style={{ ...inputSt, resize:'none', minHeight:80 }} />
            </div>
            <div>
              <label style={labelSt}>Ship Date <span style={{ fontWeight:400, color:'#aaa', textTransform:'none' }}>(optional)</span></label>
              <input type="date" value={form.ship_date} onChange={e => set('ship_date', e.target.value)} style={inputSt} />
            </div>
          </div>
        )}
      </div>

      <div style={{ position:'sticky', bottom:0, background:'#fff', borderTop:'1px solid #eee', padding:'16px 0' }}>
        <div style={{ display:'flex', gap:12, maxWidth:480, margin:'0 auto' }}>
          {step === 2 && <button onClick={() => setStep(1)} style={{ flex:'0 0 80px', background:'#f5f5f5', color:'#444', border:'none', borderRadius:14, padding:'14px', fontSize:14, fontWeight:600, cursor:'pointer' }}>← Back</button>}
          <button onClick={step === 1 ? () => setStep(2) : handleSubmit} disabled={step === 1 ? !canNext : (!canSubmit || saving)} style={{ flex:1, border: step === 2 && canSubmit ? `2px solid ${selectedReject.border}` : 'none', borderRadius:14, padding:'14px', fontSize:15, fontWeight:700, cursor:(step === 1 ? canNext : canSubmit) && !saving ? 'pointer' : 'not-allowed', background:(step === 1 ? canNext : canSubmit) && !saving ? (step === 2 ? selectedReject.bg : '#111') : '#e0e0e0', color:(step === 1 ? canNext : canSubmit) && !saving ? (step === 2 ? selectedReject.color : '#fff') : '#aaa', transition:'all 0.15s' }}>
            {step === 1 ? 'Next →' : saving ? 'Saving…' : `Submit ${form.qc_reject}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Internal Remake Form ────────────────────────────────────────────────────
function InternalRemakeForm() {
  const [form, setForm]               = useState(EMPTY_IR);
  const [needsExpert, setNeedsExpert] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);
  const [done, setDone]               = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const canSubmit = form.case_number.trim() && needsExpert !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true); setError(null);
    try {
      const { error: err } = await supabase.from('mrb_cases').insert([{
        case_number:        form.case_number.trim(),
        source:             'Internal Remake',
        business_unit:      'Removable',
        team:               form.department || null,
        logged_by:          form.logged_by || null,
        ship_date:          form.ship_date || null,
        dr_due_date:        form.dr_due_date || null,
        defect_description: form.description || null,
        needs_expert:       needsExpert,
        status:             'Open',
        opened_date:        new Date().toISOString().split('T')[0],
        created_date:       new Date().toISOString(),
      }]);
      if (err) throw err;
      setDone(true);
    } catch (e) { setError(e.message || 'Something went wrong.'); }
    finally { setSaving(false); }
  };

  const reset = () => { setForm(EMPTY_IR); setNeedsExpert(null); setDone(false); setError(null); };

  if (done) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:24, textAlign:'center' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background: needsExpert ? '#EEEDFE' : '#D4EDDA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          {needsExpert ? <Bell size={32} color="#534AB7" /> : <CheckCircle size={32} color="#3B6D11" />}
        </div>
        <h2 style={{ margin:'0 0 6px', fontSize:20, fontWeight:700 }}>Internal Remake Logged</h2>
        <p style={{ margin:'0 0 20px', fontSize:14, color:'#555' }}><strong>{form.case_number}</strong> · {form.department}</p>
        <button onClick={reset} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#1a1a1a', color:'#fff', border:'none', borderRadius:14, padding:'14px 28px', fontSize:15, fontWeight:600, cursor:'pointer', width:'100%', maxWidth:360 }}>
          <RotateCcw size={16} /> Log another internal remake
        </button>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
      <div style={{ flex:1, paddingBottom:100 }}>
        {error && <div style={{ display:'flex', gap:8, alignItems:'center', background:'#FFF0F0', border:'1px solid #FFC9C9', borderRadius:12, padding:'12px 14px', marginBottom:16, fontSize:13, color:'#C0392B' }}><AlertCircle size={15} />{error}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div>
            <label style={labelSt}>Case Number *</label>
            <input value={form.case_number} onChange={e => set('case_number', e.target.value)} placeholder="e.g. 2026-12345" style={{ ...inputSt, fontSize:17, fontWeight:600 }} autoFocus />
          </div>
          <div>
            <label style={labelSt}>Department</label>
            <div style={{ position:'relative' }}>
              <select value={form.department} onChange={e => set('department', e.target.value)} style={{ ...inputSt, appearance:'none', WebkitAppearance:'none', paddingRight:36, color: form.department ? '#111' : '#999' }}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#999', fontSize:11 }}>▾</span>
            </div>
          </div>
          <div>
            <label style={labelSt}>Your Name</label>
            <input value={form.logged_by} onChange={e => set('logged_by', e.target.value)} placeholder="Your name" style={inputSt} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={labelSt}>Ship Date</label>
              <input type="date" value={form.ship_date} onChange={e => set('ship_date', e.target.value)} style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Dr Due Date</label>
              <input type="date" value={form.dr_due_date} onChange={e => set('dr_due_date', e.target.value)} style={inputSt} />
            </div>
          </div>
          <div>
            <label style={labelSt}>Description of Issue</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe what went wrong…" rows={3} style={{ ...inputSt, resize:'none', minHeight:80 }} />
          </div>
          <div>
            <label style={labelSt}>Need Technical Expert Assistance? *</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { val:true,  label:'Yes', sub:'Notify tech experts',  ac:'#534AB7', ab:'#EEEDFE', abr:'2px solid #534AB7' },
                { val:false, label:'No',  sub:'No expert needed',     ac:'#3B6D11', ab:'#EAF3DE', abr:'2px solid #97C459' },
              ].map(({ val, label, sub, ac, ab, abr }) => {
                const a = needsExpert === val;
                return <button key={String(val)} onClick={() => setNeedsExpert(val)} style={{ background: a ? ab : '#f5f5f5', border: a ? abr : '1.5px solid #e2e2e2', borderRadius:14, padding:'16px', textAlign:'center', cursor:'pointer', transition:'all 0.15s' }}>
                  <p style={{ margin:'0 0 4px', fontSize:20, fontWeight:700, color: a ? ac : '#444' }}>{label}</p>
                  <p style={{ margin:0, fontSize:12, color: a ? ac : '#888' }}>{sub}</p>
                </button>;
              })}
            </div>
          </div>
        </div>
      </div>
      <div style={{ position:'sticky', bottom:0, background:'#fff', borderTop:'1px solid #eee', padding:'14px 0' }}>
        <button onClick={handleSubmit} disabled={!canSubmit || saving} style={{ width:'100%', border:'none', borderRadius:14, padding:'15px', fontSize:15, fontWeight:700, background: canSubmit && !saving ? (needsExpert ? '#534AB7' : '#1a1a1a') : '#e0e0e0', color: canSubmit && !saving ? '#fff' : '#aaa', cursor: canSubmit && !saving ? 'pointer' : 'not-allowed', transition:'all 0.15s' }}>
          {saving ? 'Saving…' : needsExpert === true ? 'Submit & Notify Experts' : 'Submit Internal Remake'}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function QCLogPage() {
  const [activeTab, setActiveTab] = useState('qc');
  return (
    <div style={{ minHeight:'100dvh', background:'#fafafa', fontFamily:'system-ui, sans-serif', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid #eee', padding:'14px 20px' }}>
        <div style={{ maxWidth:520, margin:'0 auto' }}>
          <h1 style={{ margin:'0 0 12px', fontSize:18, fontWeight:700, color:'#111' }}>Log Entry — Removables</h1>
          <div style={{ display:'flex', gap:0, background:'#f5f5f5', borderRadius:12, padding:4 }}>
            {[
              { key:'qc', label:'QC Reject',      icon:'🔍', sub:'ASAP · Repair · Remake' },
              { key:'ir', label:'Internal Remake', icon:'🔄', sub:'Department leads' },
            ].map(({ key, label, icon, sub }) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{ flex:1, background: activeTab === key ? '#fff' : 'transparent', border:'none', borderRadius:10, padding:'10px 12px', cursor:'pointer', transition:'all 0.15s', boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                <p style={{ margin:'0 0 2px', fontSize:14, fontWeight: activeTab === key ? 700 : 500, color: activeTab === key ? '#111' : '#888' }}>{icon} {label}</p>
                <p style={{ margin:0, fontSize:11, color: activeTab === key ? '#555' : '#aaa' }}>{sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ flex:1, padding:'20px 20px 0', maxWidth:520, margin:'0 auto', width:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column' }}>
        {activeTab === 'qc' && <QCRejectForm />}
        {activeTab === 'ir' && <InternalRemakeForm />}
      </div>
    </div>
  );
}
