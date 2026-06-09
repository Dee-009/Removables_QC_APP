import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';

// Removables BUs for external remakes filter
const REM_EXTERNAL_BUS = [
  'Removable',
  'Data Capture - Removable/Ortho',
  'Removable Outsource 2',
  'Removable:Dentures:Miscellaneous',
];

const FAULT_STYLES = {
  'Lab Fault':      'bg-rose-50 text-rose-700 border-rose-200',
  'Doctor Fault':   'bg-amber-50 text-amber-700 border-amber-200',
  "Nobody's Fault": 'bg-sky-50 text-sky-700 border-sky-200',
};

function getDateFrom(range) {
  return format(subDays(new Date(), parseInt(range)), 'yyyy-MM-dd');
}

function InternalDetailPanel({ entry, onClose }) {
  if (!entry) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Internal Remake · Removables</p>
            <h3 className="text-xl font-bold font-mono">{entry.case_number}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted ml-4"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Team', entry.team],
              ['Business Unit', entry.business_unit],
              ['Logged By', entry.logged_by],
              ['Status', entry.status],
              ['Fault', entry.fault],
              ['Ship Date', entry.ship_date],
            ].map(([label, val]) => (
              <div key={label} className="p-3 rounded-xl border bg-muted/20">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-medium">{val || '—'}</p>
              </div>
            ))}
          </div>
          {entry.defect_description && (
            <div className="p-4 rounded-xl border bg-muted/20">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm leading-relaxed">{entry.defect_description}</p>
            </div>
          )}
          {entry.corrective_action && (
            <div className="p-4 rounded-xl border bg-emerald-50">
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-2">Corrective Action</p>
              <p className="text-sm leading-relaxed text-emerald-900">{entry.corrective_action}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Remakes() {
  const [tab, setTab] = useState('internal');
  const [range, setRange] = useState('30');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const dateFrom = getDateFrom(range);

  // Internal remakes (mrb_cases, business_unit = Removable)
  const { data: internal = [], isLoading: intLoading } = useQuery({
    queryKey: ['rem_int_remakes_full', dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mrb_cases')
        .select('*')
        .eq('business_unit', 'Removable')
        .gte('created_date', dateFrom)
        .order('created_date', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  // External remakes — batch approach to avoid query limit issues
  const { data: external = [], isLoading: extLoading } = useQuery({
    queryKey: ['rem_ext_remakes_full', dateFrom],
    queryFn: async () => {
      const batchSize = 500;
      const allData = [];
      for (const bu of REM_EXTERNAL_BUS) {
        const { data } = await supabase
          .from('Cases')
          .select('"Case Number", "Primary Product", "Business Unit", "Received Date", "Doctor Due Date", "Case Status"')
          .eq('Business Unit', bu)
          .gte('"Received Date"', dateFrom)
          .ilike('"Primary Product"', '%remake%')
          .limit(batchSize);
        if (data) allData.push(...data);
      }
      return allData;
    },
  });

  const filtered = tab === 'internal'
    ? internal.filter(r => !search || r.case_number?.includes(search.toUpperCase()) || r.team?.toLowerCase().includes(search.toLowerCase()))
    : external.filter(r => !search || r['Case Number']?.includes(search.toUpperCase()));

  // Stats
  const labFault = internal.filter(r => r.fault === 'Lab Fault').length;
  const open     = internal.filter(r => r.status === 'Open').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Remakes · Removables</h1>
          <p className="text-sm text-muted-foreground">Internal & External remake tracking</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Internal Remakes', value: internal.length, color: 'text-violet-700' },
          { label: 'Open',             value: open,             color: 'text-amber-600' },
          { label: 'Lab Fault',        value: labFault,         color: 'text-rose-600'  },
          { label: 'External Remakes', value: external.length,  color: 'text-sky-600'   },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab + search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {[['internal','Internal'], ['external','External']].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setSearch(''); }} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === id ? 'bg-white shadow text-violet-700' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 text-sm" placeholder="Search case or team…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {tab === 'internal' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Case</TableHead>
                  <TableHead className="text-xs">Team</TableHead>
                  <TableHead className="text-xs">Fault</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Ship Date</TableHead>
                  <TableHead className="text-xs">Logged By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map(r => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(r)}>
                    <TableCell className="font-mono text-xs font-semibold">{r.case_number}</TableCell>
                    <TableCell className="text-xs">{r.team || '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-xs ${FAULT_STYLES[r.fault] || ''}`}>{r.fault || '—'}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.status || 'Open'}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.ship_date || '—'}</TableCell>
                    <TableCell className="text-xs">{r.logged_by || '—'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">{intLoading ? 'Loading…' : 'No remakes found'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Case</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Business Unit</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs font-semibold">{r['Case Number']}</TableCell>
                    <TableCell className="text-xs">{r['Primary Product']}</TableCell>
                    <TableCell className="text-xs">{r['Business Unit']}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r['Case Status'] || '—'}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r['Received Date'] || '—'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">{extLoading ? 'Loading…' : 'No external remakes found'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && <InternalDetailPanel entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
