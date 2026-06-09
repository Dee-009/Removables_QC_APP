import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

const qcBadge = {
  'Repair': 'bg-amber-50 text-amber-700 border-amber-200',
  'ASAP(Same day)': 'bg-red-50 text-red-700 border-red-200',
  'Remake': 'bg-violet-50 text-violet-700 border-violet-200',
  'Next Day': 'bg-blue-50 text-blue-700 border-blue-200',
};
const teamBadge = {
  PMMA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Zirconia: 'bg-primary/10 text-primary border-primary/20',
  Bars: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function DefectDetailModal({ open, onClose, defectType, logs }) {
  const filtered = logs.filter(l => l.reject_type === defectType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{defectType}</DialogTitle>
          <p className="text-sm text-muted-foreground">{filtered.length} case{filtered.length !== 1 ? 's' : ''} found</p>
        </DialogHeader>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => (
                <TableRow key={i} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm font-medium">{item.case_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={teamBadge[item.team] || ''}>{item.team}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{item.technician}</TableCell>
                  <TableCell>
                    {item.qc_reject && (
                      <Badge variant="outline" className={qcBadge[item.qc_reject] || ''}>{item.qc_reject}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm max-w-[180px] truncate">{item.reject_type || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.reject_details || '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No cases found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}