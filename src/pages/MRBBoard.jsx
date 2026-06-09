import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, CheckCircle, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_STYLES = {
  'Open':     'bg-amber-50 text-amber-700 border-amber-200',
  'Reviewed': 'bg-sky-50 text-sky-700 border-sky-200',
  'Closed':   'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function MRBDetailPanel({ entry, onClose, onStatusChange }) {
  const [status, setStatus] = useState(entry.status || 'Open');
  const [corrective, setCorrective] = useState(entry.corrective_action || '');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const save = async () => {
    setSaving(true);
    await supabase.from('mrb_cases').update({ status, corrective_action: corrective, updated_date: new Date().toISOString() }).eq('id', entry.id);
    setSaving(false);
    qc.invalidateQueries({ queryKey: ['rem_mrb'] });
    onStatusChange?.();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">MRB Case · Removables</p>
            <h3 className="text-xl font-bold font-mono">{entry.case_number}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted ml-4"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[['Team', entry.team], ['Fault', entry.fault], ['Severity', entry.severity], ['Ship Date', entry.ship_date], ['Opened', entry.opened_date], ['Product', entry.product]].map(([l,v]) => (
              <div key={l} className="p-3 rounded-xl border bg-muted/20">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
                <p className="text-sm font-medium">{v || '—'}</p>
              </div>
            ))}
          </div>
          {entry.defect_description && (
            <div className="p-4 rounded-xl border bg-muted/20">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Defect Description</p>
              <p className="text-sm leading-relaxed">{entry.defect_description}</p>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Open','Reviewed','Closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Corrective Action</label>
            <textarea className="w-full border rounded-xl p-3 text-sm min-h-[80px] resize-y bg-background" value={corrective} onChange={e => setCorrective(e.target.value)} placeholder="Describe the corrective action taken…" />
          </div>
        </div>
        <div className="px-6 py-4 border-t">
          <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </>
  );
}

export default function MRBBoard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Open');
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['rem_mrb', statusFilter],
    queryFn: async () => {
      let q = supabase.from('mrb_cases').select('*').eq('business_unit', 'Removable').order('created_date', { ascending: false }).limit(500);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = cases.filter(c => !search || c.case_number?.includes(search.toUpperCase()) || c.team?.toLowerCase().includes(search.toLowerCase()));

  const open     = cases.filter(c => c.status === 'Open').length;
  const reviewed = cases.filter(c => c.status === 'Reviewed').length;
  const closed   = cases.filter(c => c.status === 'Closed').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MRB Board · Removables</h1>
        <p className="text-sm text-muted-foreground">Material Review Board — internal remake disposition</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[['Open', open, 'text-amber-600'], ['Reviewed', reviewed, 'text-sky-600'], ['Closed', closed, 'text-emerald-600']].map(([label, val, cls]) => (
          <Card key={label} className="cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setStatusFilter(label)}>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${cls}`}>{val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 text-sm" placeholder="Search case or team…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Reviewed">Reviewed</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Case</TableHead>
                <TableHead className="text-xs">Team</TableHead>
                <TableHead className="text-xs">Fault</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Ship Date</TableHead>
                <TableHead className="text-xs">Opened</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(c)}>
                  <TableCell className="font-mono text-xs font-semibold">{c.case_number}</TableCell>
                  <TableCell className="text-xs">{c.team || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.fault || '—'}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${STATUS_STYLES[c.status] || ''}`}>{c.status || 'Open'}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.ship_date || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.opened_date || '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">{isLoading ? 'Loading…' : 'No cases found'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && <MRBDetailPanel entry={selected} onClose={() => setSelected(null)} onStatusChange={() => qc.invalidateQueries({ queryKey: ['rem_mrb'] })} />}
    </div>
  );
}
