import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

export default function TrendChart({ logs }) {
  const last21 = Array.from({ length: 21 }, (_, i) => {
    const d = subDays(new Date(), 20 - i);
    const label = format(d, 'MMM d');
    const day = logs.filter(l => l.time_stamp && format(parseISO(l.time_stamp), 'MMM d') === label);
    return {
      date: label,
      Fails: day.reduce((s, l) => s + l.failCount, 0),
      Reworks: day.reduce((s, l) => s + l.reworkCount, 0),
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quality Trend — Fails & Reworks Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last21} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0,84%,60%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRework" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(30,95%,60%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(30,95%,60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs">{v}</span>} />
              <Area type="monotone" dataKey="Fails" stroke="hsl(0,84%,60%)" fill="url(#gFail)" strokeWidth={2} />
              <Area type="monotone" dataKey="Reworks" stroke="hsl(30,95%,60%)" fill="url(#gRework)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}