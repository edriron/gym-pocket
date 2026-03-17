"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NutritionSummaryBar } from "@/components/shared/NutritionSummaryBar";
import { DietRowItem } from "./DietRowItem";
import { IngredientPicker } from "@/components/recipes/IngredientPicker";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  addDietRow,
  deleteDietSection,
  renameDietSection,
} from "@/app/(protected)/diet/actions";
import { sumNutrition } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import type {
  DietSectionWithRows,
  DietRowWithDetails,
  Product,
  Recipe,
  NutritionValues,
} from "@/types";

// Full static class strings required for Tailwind JIT
const SECTION_ACCENT: Record<string, { border: string; headerBg: string; emoji: string }> = {
  "Breakfast":       { border: "border-l-amber-400",   headerBg: "bg-amber-50/80 dark:bg-amber-950/20",   emoji: "🌅" },
  "Morning Snack":   { border: "border-l-green-400",   headerBg: "bg-green-50/80 dark:bg-green-950/20",   emoji: "🥗" },
  "Lunch":           { border: "border-l-sky-400",     headerBg: "bg-sky-50/80 dark:bg-sky-950/20",       emoji: "☀️" },
  "Afternoon Snack": { border: "border-l-violet-400",  headerBg: "bg-violet-50/80 dark:bg-violet-950/20", emoji: "🍎" },
  "Dinner":          { border: "border-l-rose-400",    headerBg: "bg-rose-50/80 dark:bg-rose-950/20",     emoji: "🌙" },
  "Evening Snack":   { border: "border-l-cyan-400",    headerBg: "bg-cyan-50/80 dark:bg-cyan-950/20",     emoji: "🫖" },
  "Pre-Workout":     { border: "border-l-lime-500",    headerBg: "bg-lime-50/80 dark:bg-lime-950/20",     emoji: "⚡" },
  "Post-Workout":    { border: "border-l-orange-400",  headerBg: "bg-orange-50/80 dark:bg-orange-950/20", emoji: "💪" },
};

const DEFAULT_ACCENT = { border: "border-l-primary", headerBg: "bg-primary/5", emoji: "🍽️" };

interface DietSectionProps {
  section: DietSectionWithRows;
  dietTableId: string;
  canEdit: boolean;
  products: Product[];
  recipes: Recipe[];
}

export function DietSection({
  section,
  dietTableId,
  canEdit,
  products,
  recipes,
}: DietSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [sectionName, setSectionName] = useState(section.name);
  const [showPicker, setShowPicker] = useState(false);
  const [localRows, setLocalRows] = useState<DietRowWithDetails[]>(section.diet_rows);

  useEffect(() => {
    setLocalRows(section.diet_rows);
  }, [section.diet_rows]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  // Use the saved name for color lookup so renaming mid-edit doesn't flash
  const accent = SECTION_ACCENT[section.name] ?? DEFAULT_ACCENT;

  const rowNutritions: NutritionValues[] = localRows.map((row) => {
    const per100g = row.product
      ? { calories: row.product.calories, carbs_g: row.product.carbs_g, protein_g: row.product.protein_g, fats_g: row.product.fats_g }
      : (row.recipe?.nutrition ?? null);
    if (!per100g) return { calories: 0, carbs_g: 0, protein_g: 0, fats_g: 0 };
    const factor = row.quantity_g / 100;
    return {
      calories: Math.round(per100g.calories * factor * 10) / 10,
      carbs_g: Math.round(per100g.carbs_g * factor * 10) / 10,
      protein_g: Math.round(per100g.protein_g * factor * 10) / 10,
      fats_g: Math.round(per100g.fats_g * factor * 10) / 10,
    };
  });
  const sectionNutrition = sumNutrition(rowNutritions);

  async function handleAddRow(item: { id: string; name: string; type: "product" | "recipe" }) {
    const product = item.type === "product" ? (productMap.get(item.id) ?? null) : null;
    const recipe = item.type === "recipe" ? (recipeMap.get(item.id) ?? null) : null;
    const defaultQty = product?.serving_size_g ?? 100;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticRow: DietRowWithDetails = {
      id: optimisticId,
      section_id: section.id,
      product_id: item.type === "product" ? item.id : null,
      recipe_id: item.type === "recipe" ? item.id : null,
      quantity_g: defaultQty,
      sort_order: localRows.length,
      created_at: new Date().toISOString(),
      product: product ?? null,
      recipe: recipe ?? null,
    };

    setLocalRows((prev) => [...prev, optimisticRow]);
    setShowPicker(false);

    const result = await addDietRow(section.id, dietTableId, item.id, item.type, defaultQty, localRows.length);

    if (result?.error) {
      toast.error(result.error);
      setLocalRows((prev) => prev.filter((r) => r.id !== optimisticId));
    } else {
      toast.success(`${item.name} added`);
    }
  }

  async function handleDeleteSection() {
    const result = await deleteDietSection(section.id, dietTableId);
    if (result?.error) toast.error(result.error);
  }

  async function handleRename() {
    if (sectionName === section.name) { setEditingName(false); return; }
    const result = await renameDietSection(section.id, sectionName, dietTableId);
    if (result?.error) toast.error(result.error);
    setEditingName(false);
  }

  return (
    <div className={cn("rounded-xl border border-l-4 overflow-hidden", accent.border)}>

      {/* Section header */}
      <div className={cn("group/header flex items-center justify-between gap-2 px-4 py-3", accent.headerBg)}>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Collapse toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>

          {/* Emoji */}
          <span className="text-base leading-none select-none shrink-0" aria-hidden>
            {accent.emoji}
          </span>

          {/* Name (editable) */}
          {editingName && canEdit ? (
            <Input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              className="h-7 text-sm font-semibold w-44"
            />
          ) : (
            <button
              className="font-semibold text-sm hover:underline text-left truncate"
              onClick={() => canEdit && setEditingName(true)}
              title={canEdit ? "Click to rename" : undefined}
            >
              {sectionName}
            </button>
          )}

          {/* Row count badge */}
          {localRows.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground font-medium tabular-nums">
              {localRows.length}
            </span>
          )}
        </div>

        {/* Action buttons — visible on hover */}
        {canEdit && (
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowPicker((v) => !v)}
              title="Add item"
              className="hover:bg-black/10 dark:hover:bg-white/10"
            >
              <Plus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setEditingName(true)}
              title="Rename section"
              className="hover:bg-black/10 dark:hover:bg-white/10"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setDeleteOpen(true)}
              title="Delete section"
              className="hover:bg-black/10 dark:hover:bg-white/10"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* Ingredient picker */}
      {showPicker && canEdit && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <IngredientPicker products={products} recipes={recipes} onSelect={handleAddRow} />
        </div>
      )}

      {/* Rows table */}
      {expanded && (
        <div>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-80 text-xs uppercase tracking-wide text-muted-foreground/70 font-semibold">Item</TableHead>
                <TableHead className="w-28 text-xs uppercase tracking-wide text-muted-foreground/70 font-semibold">Qty</TableHead>
                <TableHead className="w-16 text-xs uppercase tracking-wide text-muted-foreground/70 font-semibold text-right">kcal</TableHead>
                <TableHead className="w-16 text-xs uppercase tracking-wide text-muted-foreground/70 font-semibold text-right hidden sm:table-cell">Carbs</TableHead>
                <TableHead className="w-16 text-xs uppercase tracking-wide text-muted-foreground/70 font-semibold text-right hidden sm:table-cell">Protein</TableHead>
                <TableHead className="w-16 text-xs uppercase tracking-wide text-muted-foreground/70 font-semibold text-right hidden sm:table-cell">Fats</TableHead>
                {canEdit && <TableHead className="w-8" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {localRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <td colSpan={canEdit ? 7 : 6} className="py-8 text-center text-sm text-muted-foreground">
                    {canEdit ? (
                      <button
                        onClick={() => setShowPicker(true)}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                      >
                        <Plus className="size-3.5" /> Add your first item
                      </button>
                    ) : "No items in this section."}
                  </td>
                </TableRow>
              ) : (
                localRows.map((row) => (
                  <DietRowItem
                    key={row.id}
                    row={row}
                    dietTableId={dietTableId}
                    canEdit={canEdit && !row.id.startsWith("optimistic-")}
                  />
                ))
              )}
            </TableBody>
          </Table>

          {/* Section totals */}
          {localRows.length > 0 && (
            <div className="px-3 py-2.5 border-t bg-muted/20">
              <NutritionSummaryBar
                {...sectionNutrition}
                label={`${sectionName}:`}
                variant="section"
              />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${sectionName}"?`}
        description="All rows in this section will be deleted."
        onConfirm={handleDeleteSection}
      />
    </div>
  );
}
