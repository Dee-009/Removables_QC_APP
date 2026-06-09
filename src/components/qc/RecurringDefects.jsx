import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function RecurringDefects({ logs, threshold = 3, onDefectClick }) {
  const counts = logs.reduce((acc, l) => {
    if (l.reject_type) acc[l.reject_type] = (acc[l.reject_type] || 0) + 1;
    return acc;
  }, {});

  const recurring = Object.entries(counts)
    .filter(([, c]) => c > threshold)
    .sort((a, b) => b[1] - a[1]);

  const max = recurring[0]?.[1] || 1;

  return (
    <Card className={recurring.length > 0 ? 'ring-2 ring-amber-300' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            🟡 Recurring Defect Panel
          </CardTitle>
          {recurring.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {recurring.length} Systemic Issues
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">✅ No recurring defects above threshold</p>
        ) : (
          <div className="space-y-3">
            {recurring.map(([type, count], i) => (
              <div key={i} className="space-y-1 cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1 -mx-2 transition-colors" onClick={() => onDefectClick?.(type)}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[75%]">{type}</span>
                  <span className="text-sm font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{count}×</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}