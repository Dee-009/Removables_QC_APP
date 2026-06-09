// ── Internal Remake Dashboard — add this section to MRBBoard.jsx ─────────────
// Place this ABOVE the main MRB cases table, after the stat cards

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, UserCheck, X } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';

// ── Detail panel for internal remake log entries ──────────────────────────────
function RemakeLogPanel({ entry, onClose }) {
  if (!entry) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Internal Remake Log</p>
            <h3 className="text-xl font-bold font-mono">{entry.case_number}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {entry.time_stamp ? format(parseISO(entry.time_stamp), 'MMM d, yyyy · h:mm a') : '—'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted ml-4">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Department</p>
              <p className="text-sm font-medium">{entry.department || '—'}</p>
            </div>
            <div className="p-3 rounded-xl border bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Logged By</p>
              <p className="text-sm font-medium">{entry.logged_by || '—'}</p>
            </div>
            <div className="p-3 rounded-xl border bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ship Date</p>
              <p className="text-sm">{entry.ship_date ? format(parseISO(entry.ship_date), 'MMM d, yyyy') : '—'}</p>
            </div>
            <div className="p-3 rounded-xl border bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Doctor Due</p>
              <p className="text-sm">{entry.dr_due_date ? format(parseISO(entry.dr_due_date), 'MMM d, yyyy') : '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Expert Needed</p>
            <Badge variant="outline" className={entry.needs_expert ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-600 border-slate-200'}>
              {entry.needs_expert ? 'Yes — Staged for Expert Review' : 'No — Final QC Review'}
            </Badge>
          </div>
          {entry.description && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed text-foreground">{entry.description}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function InternalRemakeDashboard() {
  const [dateRange, setDateRange] = useState('30');
  const [filterExpert, setFilterExpert] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [selected, setSelected] = useState(null);

  const dateFrom = format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['internal_remake_log', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cb_internal_remake_log')
        .select('*')
        .gte('time_stamp', dateFrom + 'T00:00:00Z')
        .order('time_stamp', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const expertNeeded = logs.filter(l => l.needs_expert).length;
  const noExpert = logs.filter(l => !l.needs_expert).length;
  const allDepts = [...new Set(logs.map(l => l.department).filter(Boolean))].sort();

  const filtered = logs.filter(l => {
    const matchExpert = filterExpert === 'all' || (filterExpert === 'yes' ? l.needs_expert : !l.needs_expert);
    const matchDept = filterDept === 'all' || l.department === filterDept;
    return matchExpert && matchDept;
  });

  return (
    <>
      <Card className="border-violet-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-violet-600" />
              Internal Remakes Logged by Department Leads
            </CardTitle>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mini stats */}
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border text-sm">
              <span className="font-bold">{logs.length}</span>
              <span className="text-muted-foreground text-xs">Total</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-sm">
              <UserCheck className="w-3.5 h-3.5 text-violet-600" />
              <span className="font-bold text-violet-700">{expertNeeded}</span>
              <span className="text-violet-600 text-xs">Expert needed</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
              <span className="font-bold text-emerald-700">{noExpert}</span>
              <span className="text-emerald-600 text-xs">Final QC</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <Select value={filterExpert} onValueChange={setFilterExpert}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Expert needed" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cases</SelectItem>
                <SelectItem value="yes">Expert needed</SelectItem>
                <SelectItem value="no">Final QC only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {allDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No internal remakes logged in this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Case #</TableHead>
                  <TableHead className="font-semibold">Logged</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Logged By</TableHead>
                  <TableHead className="font-semibold">Ship Date</TableHead>
                  <TableHead className="font-semibold">Dr Due</TableHead>
                  <TableHead className="font-semibold">Expert?</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(l)}>
                    <TableCell className="font-mono text-sm font-bold">{l.case_number}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {l.time_stamp ? format(parseISO(l.time_stamp), 'MMM d, h:mm a') : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{l.department || '—'}</TableCell>
                    <TableCell className="text-sm">{l.logged_by || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {l.ship_date ? format(parseISO(l.ship_date), 'MMM d') : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {l.dr_due_date ? format(parseISO(l.dr_due_date), 'MMM d') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={l.needs_expert
                        ? 'bg-violet-50 text-violet-700 border-violet-200 text-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 text-xs'
                      }>
                        {l.needs_expert ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {l.description || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && <RemakeLogPanel entry={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
