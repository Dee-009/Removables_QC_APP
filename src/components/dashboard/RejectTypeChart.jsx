import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function RejectTypeChart({ data }) {
  const rejectCounts = data.reduce((acc, item) => {
    if (item.reject_type) {
      acc[item.reject_type] = (acc[item.reject_type] || 0) + 1;
    }
    return acc;
  }, {});

  const chartData = Object.entries(rejectCounts)
    .map(([name, count]) => ({ name: name.length > 25 ? name.slice(0, 25) + '…' : name, fullName: name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Reject Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(214, 32%, 91%)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                formatter={(value, _, props) => [value, props.payload.fullName]}
              />
              <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}