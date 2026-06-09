import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';

const qcBadgeClass = {
  'Repair': 'bg-amber-50 text-amber-700 border-amber-200',
  'ASAP(Same day)': 'bg-red-50 text-red-700 border-red-200',
  'Remake': 'bg-violet-50 text-violet-700 border-violet-200',
  'Next Day': 'bg-primary/10 text-primary border-primary/20',
};

export default function CaseLogTable({ data }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Cases</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Case #</TableHead>
                <TableHead className="font-semibold">Team</TableHead>
                <TableHead className="font-semibold">Technician</TableHead>
                <TableHead className="font-semibold">QC Reject</TableHead>
                <TableHead className="font-semibold">Reject Type</TableHead>
                <TableHead className="font-semibold">Details</TableHead>
                <TableHead className="font-semibold">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 20).map((item, i) => (
                <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-sm font-medium">{item.case_number}</TableCell>
                  <TableCell>{item.team}</TableCell>
                  <TableCell className="font-medium">{item.technician}</TableCell>
                  <TableCell>
                    {item.qc_reject && (
                      <Badge variant="outline" className={qcBadgeClass[item.qc_reject] || ''}>
                        {item.qc_reject}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{item.reject_type || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {item.reject_details || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {item.time_stamp ? format(parseISO(item.time_stamp), 'MMM d, h:mm a') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}