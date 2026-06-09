import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Download, X } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

// Removables business unit filter in Cases
const REM_BUS = ['Removable', 'Data Capture - Removable/Ortho', 'Removable Outsource 2'];

function classifyComplaint(subject, noteText) {
  const s = (subject || '').toLowerCase();
  const t = (noteText  || '').toLowerCase();
  if (s.includes('shipping') || s.includes('delivery') || s.includes('late') || t.includes('fedex')) return 'Late / Shipping';
  if (s.includes('shade') || t.includes('shade') || t.includes('color'))  return 'Shade / Aesthetics';
  if (s.includes('fit') || t.includes('fit') || t.includes('seat'))       return 'Fit Issue';
  if (s.includes('fracture') || t.includes('fracture') || t.includes('broke') || t.includes('chip')) return 'Breakage / Fracture';
  if (s.includes('tooth') || t.includes('tooth position') || t.includes('tooth setup')) return 'Tooth Setup';
  if (t.includes('acrylic') || t.includes('base'))    return 'Acrylic / Base Defect';
  if (t.includes('clasp') || t.includes('partial'))   return 'Clasp / Framework';
  if (s.includes('rx') || t.includes('rx not followed')) return 'Rx Not Followed';
  if (s.includes('not entered') || t.includes('never entered')) return 'Not Entered';
  return 'Other';
}

const CATEGORY_STYLES = {
  'Late / Shipping':     'bg-amber-50 text-amber-700 border-amber-200',
  'Shade / Aesthetics':  'bg-pink-50 text-pink-700 border-pink-200',
  'Fit Issue':           'bg-teal-50 text-teal-700 border-teal-200',
  'Breakage / Fracture': 'bg-stone-50 text-stone-700 border-stone-200',
  'Tooth Setup':         'bg-violet-50 text-violet-700 border-violet-200',
  'Acrylic / Base Defect':'bg-orange-50 text-orange-700 border-orange-200',
  'Clasp / Framework':   'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Rx Not Followed':     'bg-rose-50 text-rose-700 border-rose-200',
  'Not Entered':         'bg-red-50 text-red-700 border-red-200',
  'Other':               'bg-slate-50 text-slate-600 border-slate-200',
};

function DetailPanel({ complaint, onClose }) {
  if (!complaint) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer Complaint — Removables</p>
            <h3 className="text-xl font-bold font-mono">{complaint.case_number}</h3>
            <p className="text-xs text-muted-foreground mt-1">{complaint.created_date ? format(parseISO(complaint.created_date), 'MMM d, yyyy · h:mm a') : '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted ml-4"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[['Product', complaint.product], ['Category', complaint.category], ['Logged By', complaint.logged_by], ['Dr Due', complaint.doctor_due]].map(([l,v]) => (
              <div key={l} className="p-3 rounded-xl border bg-muted/20">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
                <p className="text-sm font-medium">{v || '—'}</p>
              </div>
            ))}
          </div>
          {complaint.subject && (
            <div className="p-4 rounded-xl border bg-muted/20">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Subject</p>
              <p className="text-sm font-semibold">{complaint.subject}</p>
            </div>
          )}
          {complaint.note_text && (
            <div className="p-4 rounded-xl border bg-muted/20">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Note</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{complaint.note_text}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function CustomerComplaints() {
  const [range, setRange]   = useState('30');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [selected, setSelected]   = useState(null);

  const dateFrom = format(subDays(new Date(), parseInt(range)), 'yyyy-MM-dd');

  // Batched query: notes → case lookup → filter to Removable
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['rem_complaints', dateFrom],
    queryFn: async () => {
      // Step 1: get complaint notes
      const { data: notes, error } = await supabase
        .from('case_communications')
        .select('"Case Number", "Note User Full Name", "Subject", "Note Text", "Created Date"')
        .gte('"Created Date"', dateFrom)
        .ilike('Subject', '%complaint%')
        .order('"Created Date"', { ascending: false })
        .limit(2000);
      if (error) throw error;
      if (!notes?.length) return [];

      // Step 2: batch case lookup
      const caseNums = [...new Set(notes.map(n => n['Case Number']))];
      const batchSize = 500;
      const allCases = [];
      for (let i = 0; i < caseNums.length; i += batchSize) {
        const batch = caseNums.slice(i, i + batchSize);
        const { data: batchData } = await supabase
          .from('Cases')
          .select('"Case Number", "Business Unit", "Primary Product", "Doctor Due Date"')
          .in('"Case Number"', batch)
          .in('"Business Unit"', REM_BUS);
        if (batchData) allCases.push(...batchData);
      }

      const caseMap = {};
      allCases.forEach(c => { caseMap[c['Case Number']] = c; });

      return notes
        .filter(n => caseMap[n['Case Number']])
        .map(n => ({
          case_number:  n['Case Number'],
          logged_by:    n['Note User Full Name'],
          subject:      n['Subject'],
          note_text:    n['Note Text'],
          created_date: n['Created Date'],
          product:      caseMap[n['Case Number']]?.['Primary Product'] || null,
          doctor_due:   caseMap[n['Case Number']]?.['Doctor Due Date'] || null,
          category:     classifyComplaint(n['Subject'], n['Note Text']),
        }));
    },
  });

  const categories = [...new Set(complaints.map(c => c.category))].sort();
  const filtered = complaints.filter(c => {
    const matchSearch = !search || c.case_number?.includes(search.toUpperCase()) || c.note_text?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || c.category === catFilter;
    return matchSearch && matchCat;
  });

  // Pareto chart
  const catMap = {};
  complaints.forEach(c => { catMap[c.category] = (catMap[c.category] || 0) + 1; });
  const chartData = Object.entries(catMap).sort((a,b) => b[1]-a[1]).map(([name,count]) => ({ name, count }));

  function exportCSV() {
    if (!filtered.length) return;
    const h = ['case_number','category','subject','logged_by','doctor_due','created_date'];
    const rows = filtered.map(c => h.map(k => `"${(c[k] ?? '').toString().replace(/"/g,'""')}"`).join(','));
    const blob = new Blob([h.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `rem-complaints-${dateFrom}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Complaints · Removables</h1>
          <p className="text-sm text-muted-foreground">{complaints.length} complaints · {range}-day window</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Pareto */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Complaints by Category</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 text-sm" placeholder="Search case or note…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Case</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Subject</TableHead>
                <TableHead className="text-xs">Logged By</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0,100).map((c, i) => (
                <TableRow key={i} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(c)}>
                  <TableCell className="font-mono text-xs font-semibold">{c.case_number}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${CATEGORY_STYLES[c.category] || ''}`}>{c.category}</Badge></TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{c.subject || '—'}</TableCell>
                  <TableCell className="text-xs">{c.logged_by || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.created_date ? format(parseISO(c.created_date), 'MM/dd · h:mm a') : '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">{isLoading ? 'Loading…' : 'No complaints found'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && <DetailPanel complaint={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
