import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogDetailPanel } from '@/components/qc/LogDetailPanel';
import { format, parseISO, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const REJECT_COLOR = {
  'Repair':          'bg-green-50 text-green-700 border-green-200',
  'ASAP(Same day)':  'bg-amber-50 text-amber-700 border-amber-200',
  'Next Day':        'bg-sky-50 text-sky-700 border-sky-200',
  'Remake':          'bg-rose-50 text-rose-700 border-rose-200',
  'Internal Remake': 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function QCControlDashboard() {
  const [range, setRange]   = useState('7');
  const [selected, setSelected] = useState(null);
  const [techFilter, setTechFilter] = useState('all');

  const dateFrom = format(subDays(new Date(), parseInt(range)), 'yyyy-MM-dd');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['rem_qc_control', dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rem_qc_logs')
        .select('*')
        .eq('is_sample', false)
        .gte('created_date', dateFrom)
        .order('created_date', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const techs = [...new Set(logs.map(l => l.technician).filter(Boolean))].sort();
  const filtered = techFilter === 'all' ? logs : logs.filter(l => l.technician === techFilter);

  // Tech performance
  const techMap = {};
  logs.forEach(l => {
    if (!l.technician) return;
    if (!techMap[l.technician]) techMap[l.technician] = { name: l.technician, total: 0, remakes: 0 };
    techMap[l.technician].total++;
    if (l.qc_reject === 'Remake') techMap[l.technician].remakes++;
  });
  const techData = Object.values(techMap).sort((a,b) => b.total - a.total).slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QC Control · Removables</h1>
          <p className="text-sm text-muted-foreground">Supervisor view — technician & defect detail</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All technicians" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All technicians</SelectItem>
              {techs.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Technician performance chart */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Rejects by Technician</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={techData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" name="Total" fill="#7c3aed" radius={[4,4,0,0]} />
              <Bar dataKey="remakes" name="Remakes" fill="#f43f5e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed log table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">QC Log Detail ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Case</TableHead>
                <TableHead className="text-xs">Team</TableHead>
                <TableHead className="text-xs">Technician</TableHead>
                <TableHead className="text-xs">Decision</TableHead>
                <TableHead className="text-xs">Defect Type</TableHead>
                <TableHead className="text-xs">Ship Date</TableHead>
                <TableHead className="text-xs">Date Logged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map(l => (
                <TableRow key={l.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(l)}>
                  <TableCell className="font-mono text-xs font-semibold">{l.case_number}</TableCell>
                  <TableCell className="text-xs">{l.team || '—'}</TableCell>
                  <TableCell className="text-xs">{l.technician || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${REJECT_COLOR[l.qc_reject] || ''}`}>{l.qc_reject}</Badge></TableCell>
                  <TableCell className="text-xs">{l.reject_type || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.ship_date || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.created_date ? format(parseISO(l.created_date), 'MM/dd · h:mm a') : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">{isLoading ? 'Loading…' : 'No entries found'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selected && <LogDetailPanel log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
