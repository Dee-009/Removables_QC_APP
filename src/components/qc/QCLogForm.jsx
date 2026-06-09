import React, { useState, useRef, useEffect } from 'react';
import { QCLog } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { TEAMS, TECHNICIANS_BY_TEAM } from '@/lib/teamsData';
import { CheckCircle, X, ChevronDown, Scan, AlertCircle } from 'lucide-react';

// ── Reject type catalog ──────────────────────────────────────────────────────
const REJECT_TYPES_BY_TEAM = {
  Design: [
    'ASC Dimples Not Designed',
    'Design — Files Not Placed for Milling',
    'Design — Massive Overjet / Occlusion Issue',
    'Design — Missing Model / Soft Tissue',
    'Design — Not Millable',
    'Design Error',
    'Fracture caused due to design error',
    'Incorrect screw design',
    'No Clearance Around MUA',
    'No upper arch design',
    'Open Implants Not Used',
    'Rx not followed',
    'TRI Matrix Info Incorrect — Screws, Platforms',
    'Wrong design',
    'Other',
  ],
  PMMA: [
    'Acrylic / Cement Gap Fill',
    'Debris in Interface',
    'Debonded Ti',
    'Excess Glaze',
    'Finish-Dull, Rough spots',
    'Finish-Scratches, Gouges, Embedded Debris',
    'Finish-Symmetry',
    'Gum Shade',
    'Incomplete Cleaning / Residual Material',
    'Incorrect Cementing',
    'Intaglio Polish',
    'Internal Glaze Contamination',
    'LFX Housing',
    'Missing glaze',
    'Missing Product',
    'Missing Tissue',
    'MUA Interface Damage',
    'No Clearance Around MUA',
    'Rx not followed',
    'Scanning Issue',
    'Screw Access',
    'Screw channel-Fitted, Dirty',
    'Seating issues on model',
    'Surface Porosity / Bubbles',
    'Ti Base not Cemented',
    'Tooth Shade',
    'Other',
  ],
  Zirconia: [
    'Combo Case — Denture Seating Issue',
    'Debris in Interface',
    'Finish-Dull, Rough spots',
    'Finish-Scratches, Gouges, Embedded Debris',
    'Finish-Symmetry',
    'Gum Shade',
    'Incomplete Cleaning / Residual Material',
    'Incorrect Cementing',
    'Intaglio Polish',
    'Internal Glaze Contamination',
    'Missing Product',
    'Missing Tissue',
    'MUA Interface Damage',
    'No Clearance Around MUA',
    'Rx not followed',
    'Scanning Issue',
    'Screw Access',
    'Structure Separation',
    'Surface Porosity / Bubbles',
    'Ti Base not Cemented',
    'TRI Matrix Info Incorrect — Screws, Platforms',
    'Tooth Shade',
    'Other',
  ],
  Bars: [
    'Acrylic / Cement Gap Fill',
    'Design Error',
    'Finish-Scratches, Gouges, Embedded Debris',
    'Incorrect Cementing',
    'Intaglio Polish',
    'LFX Housing',
    'Missing Documentation',
    'Missing Product',
    'Other',
    'Seating issues on model',
    'Shade Adjustment',
  ],
  Milling: [
    'Bad Print',
    'Finish-Scratches, Gouges, Embedded Debris',
    'MUA Interface Damage',
    'Other',
    'Scanning Issue',
  ],
  Printing: ['Bad Print', 'Seating issues on model', 'Other'],
  'Case Entry': ['Case Entry Error — Wrong Account', 'Rx not followed', 'Other'],
  'Case Review': ['Missing Product', 'Rx not followed', 'Other'],
  'Case Coordination': ['Other'],
  'Place Parts': ['Missing Screws', 'Missing Product', 'Finish-Scratches, Gouges, Embedded Debris', 'Other'],
  Scanning: ['Scanning Issue', 'Other'],
  'Shape and Colorize': ['Gum Shade', 'Tooth Shade', 'Scanning Issue', 'Other'],
  'Design QC': ['Finish-Scratches, Gouges, Embedded Debris', 'Rx not followed', 'Other'],
  'Design Adjustments': ['Design Error', 'Other'],
};

const DEFAULT_REJECT_TYPES = [
  'Finish-Scratches, Gouges, Embedded Debris',
  'Finish-Dull, Rough spots',
  'Finish-Symmetry',
  'Intaglio Polish',
  'Screw Access',
  'Incorrect Cementing',
  'Missing Product',
  'Rx not followed',
  'Other',
];

const QC_REJECT_OPTIONS = ['Repair', 'ASAP(Same day)', 'Next Day', 'Remake', 'Internal Remake'];

const QC_REJECT_COLORS = {
  'Repair': { bg: '#EAF3DE', text: '#3B6D11', border: '#97C459' },
  'ASAP(Same day)': { bg: '#FAEEDA', text: '#854F0B', border: '#EF9F27' },
  'Next Day': { bg: '#E6F1FB', text: '#185FA5', border: '#85B7EB' },
  'Remake': { bg: '#FCEBEB', text: '#A32D2D', border: '#F09595' },
  'Internal Remake': { bg: '#EEEDFE', text: '#534AB7', border: '#AFA9EC' },
};

const EMPTY = {
  case_number: '',
  team: '',
  technician: '',
  qc_reject: 'Repair',
  reject_type: '',
  reject_details: '',
  comments: '',
  time_stamp: '',
};

// ── Native-style Select ──────────────────────────────────────────────────────
function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: 'var(--border-radius-md)',
          padding: '10px 36px 10px 12px',
          fontSize: 14,
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--color-text-secondary)', pointerEvents: 'none',
      }} />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function QCLogForm({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1 = case/team/tech, 2 = reject details
  const caseInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && step === 1) caseInputRef.current?.focus();
  }, [open, step]);

  const set = (key, val) => {
    if (key === 'team') {
      setForm(prev => ({ ...prev, team: val, technician: '', reject_type: '' }));
    } else {
      setForm(prev => ({ ...prev, [key]: val }));
    }
  };

  const techs = form.team ? (TECHNICIANS_BY_TEAM[form.team] || []) : [];
  const rejectTypes = form.team
    ? (REJECT_TYPES_BY_TEAM[form.team] || DEFAULT_REJECT_TYPES)
    : DEFAULT_REJECT_TYPES;

  const canProceed = form.case_number.trim() && form.team && form.technician;
  const canSubmit = canProceed && form.reject_type;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await QCLog.create({
        case_number: form.case_number.trim(),
        team: form.team,
        technician: form.technician,
        qc_reject: form.qc_reject,
        reject_type: form.reject_type,
        reject_details: form.reject_details || null,
        comments: form.comments || null,
        time_stamp: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['qclogs'] });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        setForm(EMPTY);
        setStep(1);
        if (onSuccess) onSuccess();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const rejectColor = QC_REJECT_COLORS[form.qc_reject] || QC_REJECT_COLORS['Repair'];

  // ── Collapsed button ──
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: 'var(--border-radius-md)',
          padding: '9px 16px', fontSize: 14, fontWeight: 500,
          color: 'var(--color-text-primary)', cursor: 'pointer',
        }}
      >
        <Scan size={15} />
        Log QC Reject
      </button>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <div style={{
        background: 'var(--color-background-success)',
        border: '0.5px solid var(--color-border-success)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <CheckCircle size={22} color="var(--color-text-success)" />
        <div>
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-success)' }}>
            QC log saved — {form.case_number}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-success)', opacity: 0.8 }}>
            {form.technician} · {form.team} · {form.qc_reject}
          </p>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-secondary)',
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Scan size={15} color="var(--color-text-secondary)" />
          <span style={{ fontWeight: 500, fontSize: 14 }}>Log QC Reject</span>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: 20, height: 4, borderRadius: 2,
                background: step >= s ? '#534AB7' : 'var(--color-border-tertiary)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            Step {step} of 2
          </span>
        </div>
        <button
          onClick={() => { setOpen(false); setForm(EMPTY); setStep(1); setError(null); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-secondary)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 20px 8px' }}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            background: 'var(--color-background-danger)',
            border: '0.5px solid var(--color-border-danger)',
            borderRadius: 'var(--border-radius-md)',
            padding: '10px 14px', fontSize: 13, color: 'var(--color-text-danger)',
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* ── Step 1: Case / Team / Tech ── */}
        {step === 1 && (
          <div style={{ display: 'grid', gap: 14 }}>

            {/* Case number - prominent */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Case number *
              </label>
              <input
                ref={caseInputRef}
                value={form.case_number}
                onChange={e => set('case_number', e.target.value)}
                placeholder="e.g. 2026-12345"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '0.5px solid var(--color-border-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 12px', fontSize: 15, fontWeight: 500,
                  background: 'var(--color-background-primary)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
                onKeyDown={e => e.key === 'Enter' && canProceed && setStep(2)}
              />
            </div>

            {/* Team + Technician — 2 col on wide, stacked on narrow */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Department *
                </label>
                <Select
                  value={form.team}
                  onChange={v => set('team', v)}
                  options={TEAMS}
                  placeholder="Select team"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Technician *
                </label>
                <Select
                  value={form.technician}
                  onChange={v => set('technician', v)}
                  options={techs}
                  placeholder={form.team ? 'Select technician' : 'Select team first'}
                  disabled={!form.team}
                />
              </div>
            </div>


            </div>
          </div>
        )}

        {/* ── Step 2: Reject details ── */}
        {step === 2 && (
          <div style={{ display: 'grid', gap: 14 }}>

            {/* Case summary */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--color-background-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: '10px 14px', fontSize: 13,
            }}>
              <span style={{ fontWeight: 500 }}>{form.case_number}</span>
              <span style={{ color: 'var(--color-text-tertiary)' }}>·</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{form.team}</span>
              <span style={{ color: 'var(--color-text-tertiary)' }}>·</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{form.technician}</span>
            </div>

            {/* QC Reject — pill buttons */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                QC reject type *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {QC_REJECT_OPTIONS.map(opt => {
                  const col = QC_REJECT_COLORS[opt];
                  const active = form.qc_reject === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => set('qc_reject', opt)}
                      style={{
                        padding: '7px 14px', fontSize: 13, fontWeight: active ? 500 : 400,
                        borderRadius: 99, cursor: 'pointer',
                        border: active ? `1.5px solid ${col.border}` : '0.5px solid var(--color-border-tertiary)',
                        background: active ? col.bg : 'var(--color-background-primary)',
                        color: active ? col.text : 'var(--color-text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reject type select */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Reject type *
              </label>
              <Select
                value={form.reject_type}
                onChange={v => set('reject_type', v)}
                options={rejectTypes}
                placeholder="Select reject type"
              />
            </div>

            {/* Details textarea */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Details / notes
              </label>
              <textarea
                value={form.reject_details}
                onChange={e => set('reject_details', e.target.value)}
                placeholder="Describe the issue or corrective action needed…"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '0.5px solid var(--color-border-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 12px', fontSize: 14, resize: 'vertical',
                  background: 'var(--color-background-primary)',
                  color: 'var(--color-text-primary)',
                  outline: 'none', fontFamily: 'inherit',
                  minHeight: 80,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px',
        borderTop: '0.5px solid var(--color-border-tertiary)',
      }}>
        {step === 1 ? (
          <>
            <button
              onClick={() => { setOpen(false); setForm(EMPTY); setStep(1); }}
              style={{
                background: 'none', border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 'var(--border-radius-md)',
                padding: '9px 16px', fontSize: 14, cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!canProceed}
              style={{
                background: canProceed ? '#534AB7' : 'var(--color-background-secondary)',
                color: canProceed ? '#fff' : 'var(--color-text-tertiary)',
                border: 'none', borderRadius: 'var(--border-radius-md)',
                padding: '9px 20px', fontSize: 14, fontWeight: 500,
                cursor: canProceed ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              Next — Reject details →
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep(1)}
              style={{
                background: 'none', border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 'var(--border-radius-md)',
                padding: '9px 16px', fontSize: 14, cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              style={{
                background: canSubmit && !saving ? rejectColor.bg : 'var(--color-background-secondary)',
                color: canSubmit && !saving ? rejectColor.text : 'var(--color-text-tertiary)',
                border: canSubmit && !saving ? `1px solid ${rejectColor.border}` : '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-md)',
                padding: '9px 20px', fontSize: 14, fontWeight: 500,
                cursor: canSubmit && !saving ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              {saving ? 'Saving…' : `Submit ${form.qc_reject}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
