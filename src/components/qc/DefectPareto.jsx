import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function DefectPareto({ logs }) {
  const counts = logs.reduce((acc, l) => {
    if (l.reject_type) acc[l.reject_type] = (acc[l.reject_type] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, c]) => s + c, 0);
  let cum = 0;
  const data = sorted.map(([name, count]) => {
    cum += count;
    return {
      name: name.length > 22 ? name.slice(0, 22) + '…' : name,
      fullName: name,
      count,
      cumPct: Math.round((cum / total) * 100),
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Defect Pareto — Reject Type Frequency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 40, bottom: 55, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                formatter={(value, name, props) => name === 'count' ? [value, props.payload.fullName] : [`${value}%`, 'Cumulative']}
              />
              <ReferenceLine yAxisId="right" y={80} stroke="hsl(30,95%,60%)" strokeDasharray="5 5"
                label={{ value: '80%', position: 'insideRight', fontSize: 10, fill: 'hsl(30,95%,60%)' }} />
              <Bar yAxisId="left" dataKey="count" fill="hsl(221,83%,53%)" radius={[6, 6, 0, 0]} barSize={28} name="count" />
              <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="hsl(0,84%,60%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(0,84%,60%)' }} name="Cumulative %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}