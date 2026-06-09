import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const TEAMS = ['PMMA', 'Zirconia', 'Bars'];

export default function ProcessViewTable({ logs }) {
  const rows = TEAMS.map(team => {
    const tLogs = logs.filter(l => l.team === team);
    const total = tLogs.length;
    const fails = tLogs.reduce((s, l) => s + l.failCount, 0);
    const reworks = tLogs.reduce((s, l) => s + l.reworkCount, 0);
    const failRate = total > 0 ? ((fails / total) * 100).toFixed(1) : '0.0';
    return { team, total, fails, reworks, failRate };
  }).filter(r => r.total > 0);

  const maxFails = Math.max(...rows.map(r => r.fails), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Process View — Team Quality Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Process Type</TableHead>
              <TableHead className="font-semibold text-center">Total Cases</TableHead>
              <TableHead className="font-semibold text-center">Fail Count</TableHead>
              <TableHead className="font-semibold text-center">Rework Count</TableHead>
              <TableHead className="font-semibold text-center">Fail Rate %</TableHead>
              <TableHead className="font-semibold">Fail Bar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.team} className={r.fails === maxFails ? 'bg-red-50/50' : ''}>
                <TableCell>
                  <Badge variant="outline" className={
                    r.team === 'PMMA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    r.team === 'Zirconia' ? 'bg-primary/10 text-primary border-primary/20' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }>{r.team}</Badge>
                </TableCell>
                <TableCell className="text-center font-semibold">{r.total}</TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold ${r.fails > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{r.fails}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold ${r.reworks > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{r.reworks}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold text-sm px-2 py-0.5 rounded ${parseFloat(r.failRate) > 20 ? 'bg-red-100 text-red-700' : parseFloat(r.failRate) > 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {r.failRate}%
                  </span>
                </TableCell>
                <TableCell className="w-32">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(r.fails / maxFails) * 100}%` }} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}