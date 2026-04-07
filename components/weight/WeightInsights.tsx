"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format,
  parseISO,
  differenceInDays,
  differenceInCalendarWeeks,
} from "date-fns";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  RotateCcw,
  ChevronDown,
  Scale,
  CalendarRange,
  Activity,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeightChart } from "./WeightChart";
import { cn } from "@/lib/utils";
import type { WeightRecord } from "@/types";

interface WeightInsightsProps {
  records: WeightRecord[];
}

const LS_KEY = "weight-range-v1";

interface StoredRange {
  startDate: string;
  endDate: string;
}

function loadRange(): StoredRange | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredRange;
  } catch {
    return null;
  }
}

function saveRange(r: StoredRange) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(r));
  } catch {}
}

function clearRange() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

function fmt(kg: number) {
  return kg.toFixed(1);
}

function fmtDate(iso: string) {
  return format(parseISO(iso), "MMM d, yyyy");
}

// ── Goal setting (wire up to user preferences when implemented) ──────────────
// Controls which direction of change is colored "on-track" vs "off-track"
const CURRENT_GOAL: "lose" | "gain" | "maintain" = "lose";

function goalColorFor(delta: number): {
  iconClass: string;
  valueClass: string;
} {
  const isLoss = delta < -0.05;
  const isGain = delta > 0.05;

  if (CURRENT_GOAL === "lose") {
    if (isLoss)
      return {
        iconClass: "text-emerald-500",
        valueClass: "text-emerald-600 dark:text-emerald-400",
      };
    if (isGain)
      return {
        iconClass: "text-rose-500",
        valueClass: "text-rose-600 dark:text-rose-400",
      };
    return {
      iconClass: "text-sky-500",
      valueClass: "text-sky-600 dark:text-sky-400",
    };
  }
  if (CURRENT_GOAL === "gain") {
    if (isGain)
      return {
        iconClass: "text-emerald-500",
        valueClass: "text-emerald-600 dark:text-emerald-400",
      };
    if (isLoss)
      return {
        iconClass: "text-rose-500",
        valueClass: "text-rose-600 dark:text-rose-400",
      };
    return {
      iconClass: "text-sky-500",
      valueClass: "text-sky-600 dark:text-sky-400",
    };
  }
  // maintain
  if (!isLoss && !isGain)
    return {
      iconClass: "text-emerald-500",
      valueClass: "text-emerald-600 dark:text-emerald-400",
    };
  return {
    iconClass: "text-amber-500",
    valueClass: "text-amber-600 dark:text-amber-400",
  };
}

export function WeightInsights({ records }: WeightInsightsProps) {
  // records come from server sorted descending; sort ascending for logic
  const ascending = useMemo(
    () =>
      [...records].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at)),
    [records],
  );

  const [startDate, setStartDate] = useState<string>(
    () => ascending[0]?.recorded_at ?? "",
  );
  const [endDate, setEndDate] = useState<string>(
    () => ascending[ascending.length - 1]?.recorded_at ?? "",
  );
  const [mounted, setMounted] = useState(false);

  // Load persisted range after mount (avoid SSR mismatch)
  useEffect(() => {
    setMounted(true);
    const stored = loadRange();
    if (stored) {
      // Validate that the stored dates exist in the records
      const dates = new Set(ascending.map((r) => r.recorded_at));
      if (dates.has(stored.startDate) && dates.has(stored.endDate)) {
        setStartDate(stored.startDate);
        setEndDate(stored.endDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist whenever range changes (after mount)
  useEffect(() => {
    if (!mounted) return;
    if (startDate && endDate) {
      saveRange({ startDate, endDate });
    }
  }, [startDate, endDate, mounted]);

  function resetRange() {
    const first = ascending[0]?.recorded_at ?? "";
    const last = ascending[ascending.length - 1]?.recorded_at ?? "";
    setStartDate(first);
    setEndDate(last);
    clearRange();
  }

  function handleStartChange(date: string) {
    setStartDate(date);
    // If new start is after end, reset end to last record
    if (date > endDate) {
      setEndDate(ascending[ascending.length - 1]?.recorded_at ?? date);
    }
  }

  // Filtered records for the selected range
  const rangeRecords = useMemo(
    () =>
      ascending.filter(
        (r) => r.recorded_at >= startDate && r.recorded_at <= endDate,
      ),
    [ascending, startDate, endDate],
  );

  // ── Derived metrics ─────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (rangeRecords.length === 0) return null;

    const weights = rangeRecords.map((r) => Number(r.weight_kg));
    const first = weights[0];
    const last = weights[weights.length - 1];
    const delta = last - first;
    const avg = weights.reduce((s, w) => s + w, 0) / weights.length;
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const minRecord = rangeRecords.find((r) => Number(r.weight_kg) === min)!;
    const maxRecord = rangeRecords.find((r) => Number(r.weight_kg) === max)!;

    const startD = parseISO(rangeRecords[0].recorded_at);
    const endD = parseISO(rangeRecords[rangeRecords.length - 1].recorded_at);
    const days = differenceInDays(endD, startD) || 1;
    const weeks = days / 7;

    const consistency = Math.round((rangeRecords.length / weeks) * 100);

    const ratePerWeek = weeks > 0 ? delta / weeks : 0;
    const ratePerMonth = ratePerWeek * 4.33;

    // Consistency: records per week
    const calWeeks = Math.max(
      1,
      differenceInCalendarWeeks(endD, startD, { weekStartsOn: 1 }) + 1,
    );
    const recordsPerWeek = rangeRecords.length / calWeeks;

    return {
      firstWeight: first,
      lastWeight: last,
      delta,
      avg,
      min,
      max,
      minRecord,
      maxRecord,
      days,
      weeks,
      consistency,
      ratePerWeek,
      ratePerMonth,
      recordsPerWeek,
      count: rangeRecords.length,
    };
  }, [rangeRecords]);

  const isAllRecords =
    startDate === (ascending[0]?.recorded_at ?? "") &&
    endDate === (ascending[ascending.length - 1]?.recorded_at ?? "");

  if (ascending.length === 0) return null;

  return (
    <div className="space-y-5">
      {/* ── Range Selector ── */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="size-4 text-sky-500" />
            <span className="text-sm font-semibold">Analysis Range</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground shrink-0 w-8">
              From
            </label>
            <div className="relative flex-1">
              <select
                value={startDate}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-background px-3 py-1.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ascending.map((r) => (
                  <option key={r.id} value={r.recorded_at}>
                    {fmtDate(r.recorded_at)} — {fmt(Number(r.weight_kg))} kg
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground shrink-0 w-8">
              To
            </label>
            <div className="relative flex-1">
              <select
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-background px-3 py-1.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ascending
                  .filter((r) => r.recorded_at >= startDate)
                  .map((r) => (
                    <option key={r.id} value={r.recorded_at}>
                      {fmtDate(r.recorded_at)} — {fmt(Number(r.weight_kg))} kg
                    </option>
                  ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={resetRange}
              disabled={isAllRecords}
            >
              <RotateCcw className="size-3" />
            </Button>
          </div>
        </div>

        {metrics && (
          <p className="mt-2 text-xs text-muted-foreground">
            {metrics.count} record{metrics.count !== 1 ? "s" : ""} over{" "}
            {metrics.days} day{metrics.days !== 1 ? "s" : ""}
            {metrics.days >= 7 && ` (${metrics.weeks.toFixed(1)} weeks)`}
          </p>
        )}
      </div>

      {/* ── Progress Cards ── */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <InsightCard
            label="Start Weight"
            value={`${fmt(metrics.firstWeight)} kg`}
            sub={fmtDate(rangeRecords[0].recorded_at)}
            icon={Scale}
            iconClass="text-muted-foreground"
          />
          <InsightCard
            label="Change"
            value={`${metrics.delta >= 0 ? "+" : ""}${fmt(metrics.delta)} kg`}
            sub={
              (metrics.delta < -0.05
                ? "Lost"
                : metrics.delta > 0.05
                  ? "Gained"
                  : "Maintained") +
              " over " +
              metrics.weeks.toFixed(1) +
              " weeks (" +
              metrics.days +
              " days)"
            }
            icon={
              metrics.delta < -0.05
                ? TrendingDown
                : metrics.delta > 0.05
                  ? TrendingUp
                  : Minus
            }
            iconClass={goalColorFor(metrics.delta).iconClass}
            valueClass={goalColorFor(metrics.delta).valueClass}
            highlight
          />
          <InsightCard
            label="Average Progress"
            value={`${fmt(metrics.ratePerWeek)} kg`}
            sub={`${fmt(metrics.ratePerMonth)} kg per month`}
            icon={Activity}
            iconClass="text-orange-500"
          />
          <InsightCard
            label="Consistency"
            value={`${metrics.consistency}%`}
            sub={`Aim for 1 record per week`}
            icon={Calendar}
            valueClass={
              metrics.consistency >= 100 ? "text-emerald-500" : "text-rose-400"
            }
          />
          <InsightCard
            label="Current Weight"
            value={`${fmt(metrics.lastWeight)} kg`}
            sub={fmtDate(rangeRecords[rangeRecords.length - 1].recorded_at)}
            icon={Scale}
            iconClass="text-sky-500"
          />
        </div>
      )}

      {/* ── Filtered chart ── */}
      {rangeRecords.length >= 2 && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Weight Trend
          </h2>
          <WeightChart records={rangeRecords} />
        </div>
      )}
    </div>
  );
}

// ── InsightCard ────────────────────────────────────────────────────────────

interface InsightCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass?: string;
  valueClass?: string;
  highlight?: boolean;
}

function InsightCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  valueClass,
  highlight,
}: InsightCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 flex flex-col gap-1",
        highlight && "border-2",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
        <Icon className={cn("size-3.5", iconClass)} />
      </div>
      <span
        className={cn(
          "text-xl font-bold tabular-nums leading-tight",
          valueClass,
        )}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[11px] text-muted-foreground leading-tight">
          {sub}
        </span>
      )}
    </div>
  );
}
