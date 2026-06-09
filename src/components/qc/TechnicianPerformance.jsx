import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default function TechnicianPerformance({ logs }) {
  const techMap = {};
  logs.forEach(l => {
    if (!l.technician) return;
    if (!techMap[l.technician]) {
      techMap[l.technician] = { name: l.technician, team: l.team, total: 0, fails: 0, reworks: 0, trainingFlag: 0 };
    }
    techMap[l.technician].total += 1;
    techMap[l.technician].fails += l.failCount;
    techMap[l.technician].reworks += l.reworkCount;
    techMap[l.technician].trainingFlag = l.trainingFlag;
  });

  const rows = Object.values(techMap).sort((a, b) => b.fails - a.fails);
  const teamBadge = {
    PMMA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Zirconia: 'bg-primary/10 text-primary border-primary/20',
    Bars: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Technician Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Technician</TableHead>
              <TableHead className="font-semibold">Team</TableHead>
              <TableHead className="font-semibold text-center">Total Cases</TableHead>
              <TableHead className="font-semibold text-center">Fail Count</TableHead>
              <TableHead className="font-semibold text-center">Rework Count</TableHead>
              <TableHead className="font-semibold text-center">Fail Rate %</TableHead>
              <TableHead className="font-semibold text-center">Training Flag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const rate = r.total > 0 ? ((r.fails / r.total) * 100).toFixed(1) : '0.0';
              return (
                <TableRow key={i} className={r.trainingFlag ? 'bg-blue-50/60' : ''}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={teamBadge[r.team] || ''}>{r.team}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{r.total}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${r.fails > 0 ? 'text-red-600' : ''}`}>{r.fails}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${r.reworks > 0 ? 'text-amber-600' : ''}`}>{r.reworks}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${parseFloat(rate) > 20 ? 'bg-red-100 text-red-700' : parseFloat(rate) > 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {rate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {r.trainingFlag ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Training
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}