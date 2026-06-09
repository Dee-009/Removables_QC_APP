import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, QCLog } from '@/api/supabaseClient';
import { LogDetailPanel } from '@/components/qc/LogDetailPanel';
import { Download, RotateCcw, Wrench, ClipboardList, TrendingUp, AlertTriangle, ArrowUp, ArrowDown, Minus, Truck, MessageCircleWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend
} from 'recharts';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';

// Removables business units
const REM_BUSINESS_UNITS = [
  'Removable',
  'Data Capture - Removable/Ortho',
  'Removable Outsource 2',
  'Removable:Dentures:Miscellaneous',
];

function getDateBounds(range) {
  if (range.startsWith('day-')) {
    const n = parseInt(range.replace('day-', ''));
    const d = subDays(new Date(), n);
    return { from: startOfDay(d), to: endOfDay(d), label: n === 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago`, fromStr: format(d, 'yyyy-MM-dd') };
  }
  const days = parseInt(range);
  const from = subDays(new Date(), days);
  return { from, to: new Date(), label: `Last ${days} days`, fromStr: format(from, 'yyyy-MM-dd') };
}

function Trend({ value, inverse }) {
  if (value === null || value === undefined) return null;
  const good = inverse ? value < 0 : value > 0;
  const color = value === 0 ? 'text-muted-foreground' : good ? 'text-emerald-600' : 'text-rose-600';
  const Icon = value === 0 ? Minus : value > 0 ? ArrowUp : ArrowDown;
  return (
    <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${color}`}>
      <Icon className="w-3 h-3" />{Math.abs(value).toFixed(1)}% vs prev period
    </div>
  );
}

function KPI({ label, value, sub, icon: Icon, iconBg, trend, inverse, alert }) {
  return (
    <Card className={alert ? 'border-rose-200' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            <Trend value={trend} inverse={inverse} />
          </div>
          <div className={`p-2.5 rounded-xl shrink-0 ml-3 ${iconBg}`}><Icon className="w-5 h-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadershipDashboard() {
  const qc = useQueryClient();
  const [range, setRange] = useState('30');
  const [selected, setSelected] = useState(null);

  const { from, fromStr, label } = getDateBounds(range);
  const prevFrom = format(subDays(from, parseInt(range.replace('day-', '1'))), 'yyyy-MM-dd');

  // QC logs from rem_qc_logs
  const { data: logs = [] } = useQuery({
    queryKey: ['rem_qc_logs', fromStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rem_qc_logs')
        .select('*')
        .eq('is_sample', false)
        .gte('created_date', fromStr)
        .order('created_date', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60000,
  });

  // External remakes from Cases table
  const { data: extRemakes = [] } = useQuery({
    queryKey: ['rem_ext_remakes', fromStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Cases')
        .select('"Case Number", "Primary Product", "Business Unit", "Received Date", "Doctor Due Date"')
        .in('Business Unit', REM_BUSINESS_UNITS)
        .gte('"Received Date"', fromStr)
        .ilike('"Primary Product"', '%remake%')
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 120000,
  });

  // Internal remakes from mrb_cases
  const { data: intRemakes = [] } = useQuery({
    queryKey: ['rem_int_remakes', fromStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mrb_cases')
        .select('*')
        .eq('business_unit', 'Removable')
        .gte('created_date', fromStr)
        .order('created_date', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 120000,
  });

  // Subscribe to real-time
  useEffect(() => {
    const unsub = QCLog.subscribe(() => qc.invalidateQueries({ queryKey: ['rem_qc_logs'] }));
    return unsub;
  }, [qc]);

  // --- Compute KPIs ---
  const rejectCount = logs.length;
  const remakeCount = logs.filter(l => l.qc_reject === 'Remake').length;
  const repairCount = logs.filter(l => l.qc_reject === 'Repair').length;
  const asapCount   = logs.filter(l => l.qc_reject === 'ASAP(Same day)').length;

  // Defect breakdown
  const defectMap = {};
  logs.forEach(l => { if (l.reject_type) defectMap[l.reject_type] = (defectMap[l.reject_type] || 0) + 1; });
  const defectData = Object.entries(defectMap).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,count]) => ({ name, count }));

  // Team breakdown
  const teamMap = {};
  logs.forEach(l => { if (l.team) teamMap[l.team] = (teamMap[l.team] || 0) + 1; });
  const teamData = Object.entries(teamMap).sort((a,b) => b[1]-a[1]).map(([name,count]) => ({ name, count }));

  // Daily trend (last 14 days)
  const dailyMap = {};
  logs.forEach(l => {
    if (!l.created_date) return;
    const day = format(parseISO(l.created_date), 'MM/dd');
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  });
  const trendData = Object.entries(dailyMap).sort((a,b) => a[0].localeCompare(b[0])).slice(-14).map(([date, rejects]) => ({ date, rejects }));

  function exportCSV() {
    if (!logs.length) return;
    const headers = ['case_number','team','technician','qc_reject','reject_type','reject_details','ship_date','created_date'];
    const rows = logs.map(l => headers.map(h => `"${(l[h] ?? '').toString().replace(/"/g,'""')}"`).join(','));
    const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `removables-qc-${fromStr}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Removables QC Dashboard</h1>
          <p className="text-sm text-muted-foreground">{label} · {rejectCount} QC entries</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day-0">Today</SelectItem>
              <SelectItem value="day-1">Yesterday</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total QC Rejects" value={rejectCount} icon={ClipboardList} iconBg="bg-violet-50 text-violet-600" />
        <KPI label="Remakes" value={remakeCount} icon={RotateCcw} iconBg="bg-rose-50 text-rose-600" alert={remakeCount > 5} />
        <KPI label="Repairs" value={repairCount} icon={Wrench} iconBg="bg-amber-50 text-amber-700" />
        <KPI label="ASAP / Rush" value={asapCount} icon={Truck} iconBg="bg-sky-50 text-sky-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Defect Types</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={defectData} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Daily Rejects Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rejects" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team breakdown + Internal remakes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Rejects by Team</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#a78bfa" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Internal Remakes ({intRemakes.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Case</TableHead>
                  <TableHead className="text-xs">Team</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intRemakes.slice(0,8).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-semibold">{r.case_number}</TableCell>
                    <TableCell className="text-xs">{r.team || '—'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.status || 'Open'}</Badge></TableCell>
                  </TableRow>
                ))}
                {intRemakes.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-4">No internal remakes</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent QC Log table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent QC Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Case</TableHead>
                <TableHead className="text-xs">Team</TableHead>
                <TableHead className="text-xs">Technician</TableHead>
                <TableHead className="text-xs">Decision</TableHead>
                <TableHead className="text-xs">Defect</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 50).map(l => (
                <TableRow key={l.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(l)}>
                  <TableCell className="font-mono text-xs font-semibold">{l.case_number}</TableCell>
                  <TableCell className="text-xs">{l.team || '—'}</TableCell>
                  <TableCell className="text-xs">{l.technician || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{l.qc_reject}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{l.reject_type || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.created_date ? format(parseISO(l.created_date), 'MM/dd · h:mm a') : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No QC entries for this period</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && <LogDetailPanel log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
