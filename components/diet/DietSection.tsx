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
import type {
  DietSectionWithRows,
  DietRowWithDetails,
  Product,
  Recipe,
  NutritionValues,
} from "@/types";

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
  const [localRows, setLocalRows] = useState<DietRowWithDetails[]>(
    section.diet_rows,
  );

  // Sync local rows when server data updates (after revalidatePath)
  useEffect(() => {
    setLocalRows(section.diet_rows);
  }, [section.diet_rows]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  // Calculate section nutrition from local rows.
  // Recipe nutrition is stored per 100g (pre-computed in page server component).
  const rowNutritions: NutritionValues[] = localRows.map((row) => {
    const per100g = row.product
      ? {
          calories: row.product.calories,
          carbs_g: row.product.carbs_g,
          protein_g: row.product.protein_g,
          fats_g: row.product.fats_g,
        }
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

  async function handleAddRow(item: {
    id: string;
    name: string;
    type: "product" | "recipe";
  }) {
    const product =
      item.type === "product" ? (productMap.get(item.id) ?? null) : null;
    const recipe =
      item.type === "recipe" ? (recipeMap.get(item.id) ?? null) : null;
    const defaultQty = product?.serving_size_g ?? 100;

    // Optimistic row — immediately shown while server call is in flight
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

    const result = await addDietRow(
      section.id,
      dietTableId,
      item.id,
      item.type,
      defaultQty,
      localRows.length,
    );

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
    if (sectionName === section.name) {
      setEditingName(false);
      return;
    }
    const result = await renameDietSection(
      section.id,
      sectionName,
      dietTableId,
    );
    if (result?.error) toast.error(result.error);
    setEditingName(false);
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between gap-2 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          {editingName && canEdit ? (
            <Input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              className="h-7 text-sm font-semibold w-48"
            />
          ) : (
            <button
              className="font-semibold text-sm hover:underline text-left"
              onClick={() => canEdit && setEditingName(true)}
            >
              {sectionName}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPicker((v) => !v)}
                title="Add item"
              >
                <Plus className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditingName(true)}
                title="Rename section"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDeleteOpen(true)}
                title="Delete section"
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Ingredient picker */}
      {showPicker && canEdit && (
        <div className="px-4 py-2 border-b bg-background">
          <IngredientPicker
            products={products}
            recipes={recipes}
            onSelect={handleAddRow}
          />
        </div>
      )}

      {/* Rows table */}
      {expanded && (
        <div>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-80">Item</TableHead>
                <TableHead className="w-28">Qty</TableHead>
                <TableHead className="w-16 text-right">kcal</TableHead>
                <TableHead className="w-16 text-right hidden sm:table-cell">
                  Carbs
                </TableHead>
                <TableHead className="w-16 text-right hidden sm:table-cell">
                  Protein
                </TableHead>
                <TableHead className="w-16 text-right hidden sm:table-cell">
                  Fats
                </TableHead>
                {canEdit && <TableHead className="w-8" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {localRows.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={canEdit ? 7 : 6}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    {canEdit
                      ? "No items yet. Click + to add products or recipes."
                      : "No items in this section."}
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
            <div className="px-4 py-2 bg-muted/20">
              <NutritionSummaryBar
                {...sectionNutrition}
                label={`${sectionName} total:`}
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
