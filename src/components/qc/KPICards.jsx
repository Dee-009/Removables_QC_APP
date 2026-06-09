import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, XCircle, Wrench, Percent, AlertOctagon, ShieldAlert } from 'lucide-react';

const cards = [
  { key: 'totalCases',      label: 'Total Cases',       icon: ClipboardList,  color: 'text-primary bg-primary/10' },
  { key: 'failCount',       label: 'Fail Count',        icon: XCircle,        color: 'text-red-600 bg-red-50' },
  { key: 'reworkCount',     label: 'Rework Count',      icon: Wrench,         color: 'text-amber-600 bg-amber-50' },
  { key: 'failRate',        label: 'Fail Rate %',       icon: Percent,        color: 'text-orange-600 bg-orange-50' },
  { key: 'criticalDefects', label: 'Critical Defects',  icon: AlertOctagon,   color: 'text-red-700 bg-red-100' },
  { key: 'escapedDefects',  label: 'Escaped Defects',   icon: ShieldAlert,    color: 'text-rose-700 bg-rose-100' },
];

export default function KPICards({ logs }) {
  const total = logs.length;
  const fails = logs.reduce((s, l) => s + l.failCount, 0);
  const reworks = logs.reduce((s, l) => s + l.reworkCount, 0);
  const failRate = total > 0 ? ((fails / total) * 100).toFixed(1) : '0.0';
  const critical = logs.reduce((s, l) => s + l.criticalDefect, 0);
  const escaped = logs.reduce((s, l) => s + l.escapedDefect, 0);

  const values = { totalCases: total, failCount: fails, reworkCount: reworks, failRate: `${failRate}%`, criticalDefects: critical, escapedDefects: escaped };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <Card key={key} className={`hover:shadow-md transition-shadow ${(key === 'criticalDefects' || key === 'escapedDefects') && values[key] > 0 ? 'ring-2 ring-red-300' : ''}`}>
          <CardContent className="p-4">
            <div className={`p-2 rounded-lg w-fit ${color} mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{values[key]}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}