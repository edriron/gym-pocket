'use client'

import { format, parseISO } from 'date-fns'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { WeightRecord } from '@/types'

interface WeightChartProps {
  records: WeightRecord[]
}

export function WeightChart({ records }: WeightChartProps) {
  const data = [...records]
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
    .map((r) => ({
      date: format(parseISO(r.recorded_at), 'MMM d'),
      weight: r.weight_kg,
    }))

  if (data.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Add at least 2 records to see your weight trend
      </div>
    )
  }

  const weights = data.map((d) => d.weight)
  const minW = Math.floor(Math.min(...weights)) - 1
  const maxW = Math.ceil(Math.max(...weights)) + 1

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={36}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: 12,
            }}
            formatter={(value) => [`${value} kg`, 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-primary)' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
