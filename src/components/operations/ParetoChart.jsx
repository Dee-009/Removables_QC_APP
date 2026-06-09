import React, { useRef } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

function buildParetoData(logs, classifyOther) {
  const counts = logs.reduce((acc, l) => {
    if (!l.reject_type) return acc;
    const key = l.reject_type === 'Other' ? classifyOther(l.reject_details) : l.reject_type;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts)
    .map(([name, count]) => ({ name: name.length > 26 ? name.slice(0, 26) + '…' : name, fullName: name, count }))
    .sort((a, b) => b.count - a.count);
  const total = sorted.reduce((s, d) => s + d.count, 0);
  let cum = 0;
  return sorted.map(d => {
    cum += d.count;
    return { ...d, cumPct: Math.round(cum / total * 100) };
  });
}

export default function ParetoChart({ logs, classifyOther, color = 'hsl(221,83%,53%)', title }) {
  const printId = useRef(`pareto-print-${Math.random().toString(36).slice(2)}`).current;

  const handlePrint = () => {
    const el = document.getElementById(printId);
    if (!el) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${title || 'Pareto Chart'}</title>
      <style>
        body { font-family: sans-serif; padding: 24px; }
        h2 { font-size: 16px; margin-bottom: 16px; color: #333; }
        svg { width: 100% !important; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style>
      </head><body>
      <h2>${title || 'Defect Pareto'}</h2>
      ${el.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const data = buildParetoData(logs, classifyOther);
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10">No data for this period</p>;
  }
  return (
    <div>
      <div className="flex justify-end mb-1">
        <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-1 text-muted-foreground h-7 px-2">
          <Printer className="w-3.5 h-3.5" />
          <span className="text-xs">Print</span>
        </Button>
      </div>
      <div id={printId} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 40, bottom: 60, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,32%,91%)" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              formatter={(value, name, props) =>
                name === 'count'
                  ? [value, props.payload.fullName]
                  : [`${value}%`, 'Cumulative %']
              }
            />
            <Bar yAxisId="left" dataKey="count" fill={color} radius={[6, 6, 0, 0]} barSize={24} name="count" />
            <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="hsl(0,84%,60%)" strokeWidth={2} dot={{ r: 2 }} name="Cumulative %" />
            <ReferenceLine yAxisId="right" y={80} stroke="hsl(30,95%,60%)" strokeDasharray="4 4" label={{ value: '80%', position: 'right', fontSize: 10 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}