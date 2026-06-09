import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { X, Calendar, User, FileText, Clock, AlertTriangle, ChevronDown, ChevronUp, MessageSquare, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

const QC_REJECT_STYLES = {
  'Repair':          'bg-emerald-50 text-emerald-700 border-emerald-200',
  'ASAP(Same day)':  'bg-amber-50 text-amber-700 border-amber-200',
  'Next Day':        'bg-sky-50 text-sky-700 border-sky-200',
  'Remake':          'bg-rose-50 text-rose-700 border-rose-200',
  'Internal Remake': 'bg-violet-50 text-violet-700 border-violet-200',
};

const TEAM_COLORS = {
  PMMA: 'bg-blue-50 text-blue-700 border-blue-200',
  Zirconia: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Bars: 'bg-amber-50 text-amber-700 border-amber-200',
  Design: 'bg-violet-50 text-violet-700 border-violet-200',
  Milling: 'bg-orange-50 text-orange-700 border-orange-200',
  Printing: 'bg-pink-50 text-pink-700 border-pink-200',
  'Case Entry': 'bg-sky-50 text-sky-700 border-sky-200',
  'Case Review': 'bg-teal-50 text-teal-700 border-teal-200',
  'Case Coordination': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Place Parts': 'bg-slate-50 text-slate-700 border-slate-200',
  Scanning: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Shape and Colorize': 'bg-lime-50 text-lime-700 border-lime-200',
  'Design QC': 'bg-purple-50 text-purple-700 border-purple-200',
};

function formatTs(ts) {
  if (!ts) return '—';
  try { return format(parseISO(ts), 'MMM d yyyy · h:mm a'); } catch { return ts; }
}

function Field({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm leading-relaxed text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ── Case note card ────────────────────────────────────────────────────────────
function NoteCard({ note }) {
  const [expanded, setExpanded] = useState(false);
  const text = note['Note Text'] || note['Description'] || '';
  const SHORT_LIMIT = 200;
  const isLong = text.length > SHORT_LIMIT;
  const displayText = expanded || !isLong ? text : text.slice(0, SHORT_LIMIT) + '…';

  // Strip repeated "Copied from Case" sections for cleaner display
  const cleanText = displayText.replace(/={10,}\r?\nCopied from Case[\s\S]*?={10,}/g, '').trim();

  return (
    <div className="border rounded-xl p-4 space-y-2 hover:bg-muted/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {(note['Note User Full Name'] || '?').replace('OC-', '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{(note['Note User Full Name'] || '').replace('OC-', '')}</p>
            {note['Subject'] && <p className="text-xs text-muted-foreground truncate">{note['Subject']}</p>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
          {note['Created Date'] ? format(parseISO(note['Created Date']), 'MMM d, h:mm a') : ''}
        </p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{cleanText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
        </button>
      )}
    </div>
  );
}

// ── Case Notes section ────────────────────────────────────────────────────────
function CaseNotes({ caseNumber }) {
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['case_notes', caseNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Case Notes')
        .select('"Case Number", "Note User Full Name", "Subject", "Note Text", "Description", "Created Date"')
        .eq('Case Number', caseNumber)
        .order('Created Date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!caseNumber,
  });

  if (isLoading) return (
    <div className="flex items-center gap-2 py-4 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Loading case notes…</span>
    </div>
  );

  if (!notes.length) return (
    <p className="text-sm text-muted-foreground py-3 italic">No case notes found in ABS.</p>
  );

  return (
    <div className="space-y-3">
      {notes.map((note, i) => <NoteCard key={i} note={note} />)}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function LogDetailPanel({ log, onClose }) {
  const [showNotes, setShowNotes] = useState(false);

  if (!log) return null;

  const initials = (name) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">QC Log Entry</p>
            <h3 className="text-xl font-bold font-mono">{log.case_number || 'Unknown'}</h3>
            <p className="text-xs text-muted-foreground mt-1">{formatTs(log.time_stamp)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted ml-4 mt-0.5">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Tech + Team */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {initials(log.technician)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{log.technician || '—'}</p>
              <Badge variant="outline" className={`text-xs mt-1 ${TEAM_COLORS[log.team] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                {log.team || '—'}
              </Badge>
            </div>
          </div>

          {/* QC Reject + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">QC Reject</p>
              <Badge variant="outline" className={`text-xs ${QC_REJECT_STYLES[log.qc_reject] || ''}`}>
                {log.qc_reject || '—'}
              </Badge>
            </div>
            <div className="p-3 rounded-xl border bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reject Type</p>
              <p className="text-sm font-medium leading-snug">{log.reject_type || '—'}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4 border-t pt-4">
            <Field icon={FileText} label="Reject Details" value={log.reject_details} />
            <Field icon={FileText} label="Comments" value={log.comments} />
            <Field icon={User} label="Reviewed By" value={log.reviewed_by} />
            <Field icon={FileText} label="Route Back — Department" value={log.route_back_dept} />
            <Field icon={FileText} label="Route Back — Details" value={log.route_back_details} />
          </div>

          {/* Internal Remake extras */}
          {log.qc_reject === 'Internal Remake' && (log.rush_required || log.ship_date || log.appointment_reschedule_needed) && (
            <div className="border rounded-xl p-4 space-y-2 border-violet-200 bg-violet-50/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Internal Remake Details</p>
              {log.rush_required === 'Yes' && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-xs text-rose-700 font-semibold">Rush Required</span>
                </div>
              )}
              {log.ship_date && <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-violet-600" /><span className="text-xs text-violet-700">Ship date: {log.ship_date}</span></div>}
              {log.new_date_days_needed && <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-violet-600" /><span className="text-xs text-violet-700">{log.new_date_days_needed} days needed</span></div>}
              {log.appointment_reschedule_needed && <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-violet-600" /><span className="text-xs text-violet-700">Reschedule: {log.appointment_reschedule_needed}</span></div>}
            </div>
          )}

          {/* ── ABS Case Notes ── */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">ABS Case Notes</span>
              </div>
              {showNotes
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showNotes && (
              <div className="mt-3">
                <CaseNotes caseNumber={log.case_number} />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t pt-4 space-y-1.5 text-xs text-muted-foreground">
            {log.created_by && <p>Logged by: <span className="text-foreground">{log.created_by}</span></p>}
            {log.created_date && <p>Created: <span className="text-foreground">{formatTs(log.created_date)}</span></p>}
            {log.id && <p className="font-mono opacity-40">ID: {log.id.slice(0, 8)}…</p>}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Standalone case lookup (for Remakes page) ─────────────────────────────────
export function CaseNotesPanel({ caseNumber, onClose }) {
  if (!caseNumber) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">ABS Case Notes</p>
            <h3 className="text-xl font-bold font-mono">{caseNumber}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted ml-4">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <CaseNotes caseNumber={caseNumber} />
        </div>
      </div>
    </>
  );
}
