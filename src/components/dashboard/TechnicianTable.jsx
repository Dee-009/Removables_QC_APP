import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const teamBadgeClass = {
  PMMA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Zirconia: 'bg-primary/10 text-primary border-primary/20',
  Bars: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function TechnicianTable({ data, selectedTeam }) {
  const techStats = {};

  data.forEach(item => {
    if (selectedTeam && selectedTeam !== 'all' && item.team !== selectedTeam) return;
    const key = `${item.technician}||${item.team}`;
    if (!techStats[key]) {
      techStats[key] = { name: item.technician, team: item.team, cases: 0, rejectTypes: {} };
    }
    techStats[key].cases += 1;
    if (item.reject_type) {
      techStats[key].rejectTypes[item.reject_type] = (techStats[key].rejectTypes[item.reject_type] || 0) + 1;
    }
  });

  const rows = Object.values(techStats).sort((a, b) => b.cases - a.cases);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Technician Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Technician</TableHead>
                <TableHead className="font-semibold">Team</TableHead>
                <TableHead className="font-semibold text-center">Total Cases</TableHead>
                <TableHead className="font-semibold">Top Reject Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const topReject = Object.entries(row.rejectTypes).sort((a, b) => b[1] - a[1])[0];
                return (
                  <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={teamBadgeClass[row.team] || ''}>
                        {row.team}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{row.cases}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {topReject ? `${topReject[0]} (${topReject[1]})` : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}