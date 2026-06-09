import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(0, 84%, 60%)', 'hsl(30, 95%, 60%)', 'hsl(280, 67%, 60%)'];

export default function QCRejectChart({ data }) {
  const rejectCounts = data.reduce((acc, item) => {
    if (item.qc_reject) {
      acc[item.qc_reject] = (acc[item.qc_reject] || 0) + 1;
    }
    return acc;
  }, {});

  const chartData = Object.entries(rejectCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">QC Reject Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                formatter={(value) => <span className="text-sm text-foreground ml-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}