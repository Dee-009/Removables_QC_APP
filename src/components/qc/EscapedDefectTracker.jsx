import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function EscapedDefectTracker({ logs }) {
  const escaped = logs.filter(l => l.escapedDefect === 1);

  return (
    <Card className={escaped.length > 0 ? 'ring-2 ring-rose-300' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            🔥 Escaped Defect Tracker
          </CardTitle>
          {escaped.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5" />
              {escaped.length} Escaped
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {escaped.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">✅ No escaped defects in this period</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-rose-50/60">
                <TableHead className="font-semibold">Case #</TableHead>
                <TableHead className="font-semibold">Team</TableHead>
                <TableHead className="font-semibold">Technician</TableHead>
                <TableHead className="font-semibold">Reject Type</TableHead>
                <TableHead className="font-semibold">Reject Details</TableHead>
                <TableHead className="font-semibold">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escaped.map((item, i) => (
                <TableRow key={i} className="bg-red-50/40 hover:bg-red-50/70">
                  <TableCell className="font-mono text-sm font-bold text-red-700">{item.case_number}</TableCell>
                  <TableCell><Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{item.team}</Badge></TableCell>
                  <TableCell className="font-medium">{item.technician}</TableCell>
                  <TableCell className="text-sm">{item.reject_type || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.reject_details || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.time_stamp ? format(parseISO(item.time_stamp), 'MMM d, h:mm a') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}