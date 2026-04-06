"use client";

import { useState, useMemo } from "react";
import {
  Loader2,
  Plus,
  ChefHat,
  ShoppingBasket,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addFoodLog } from "@/app/(protected)/log/actions";
import type { Product, Recipe } from "@/types";

interface AddFoodEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  recipes: Recipe[];
  /** The gym-day date string YYYY-MM-DD – used as default date */
  gymDay: string;
}

type ItemOption = { type: "product" | "recipe"; id: string; name: string };

export function AddFoodEntryDialog({
  open,
  onOpenChange,
  products,
  recipes,
  gymDay,
}: AddFoodEntryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [selected, setSelected] = useState<ItemOption | null>(null);
  const [quantityStr, setQuantityStr] = useState("100");

  const now = new Date();
  const [date, setDate] = useState(gymDay);
  const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState(
    String(now.getMinutes()).padStart(2, "0"),
  );

  // Selected product (for serving options)
  const selectedProduct: Product | null = useMemo(
    () =>
      selected?.type === "product"
        ? (products.find((p) => p.id === selected.id) ?? null)
        : null,
    [selected, products],
  );

  // Serving options: always 100g first, then product-specific options
  const servingOptions = useMemo(() => {
    const isRecipe = selected?.type === "recipe";
    const base = [{ label: isRecipe ? "100g (1 Unit)" : "100g", weight_g: 100 }];
    if (!selectedProduct?.serving_options?.length) return base;
    return [...base, ...selectedProduct.serving_options];
  }, [selected, selectedProduct]);

  function reset() {
    setSelected(null);
    setQuantityStr("100");
    setDate(gymDay);
    const n = new Date();
    setHour(String(n.getHours()).padStart(2, "0"));
    setMinute(String(n.getMinutes()).padStart(2, "0"));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      toast.error("Select a product or recipe");
      return;
    }
    const quantity = parseFloat(quantityStr);
    if (!quantity || quantity <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    const h = parseInt(hour) || 0;
    const m = parseInt(minute) || 0;
    const logged = new Date(
      `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
    );

    setLoading(true);
    try {
      const result = await addFoodLog({
        product_id: selected.type === "product" ? selected.id : undefined,
        recipe_id: selected.type === "recipe" ? selected.id : undefined,
        quantity_g: quantity,
        logged_at: logged.toISOString(),
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Entry added");
        onOpenChange(false);
        reset();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Food Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item picker */}
          <div className="space-y-1.5">
            <Label>Product or Recipe</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between font-normal"
                >
                  {selected ? (
                    <span className="flex items-center gap-1.5 truncate">
                      {selected.type === "recipe" ? (
                        <ChefHat className="size-3.5 shrink-0 text-pink-500" />
                      ) : (
                        <ShoppingBasket className="size-3.5 shrink-0 text-amber-500" />
                      )}
                      {selected.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Search…</span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search products & recipes…" />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Products">
                      {products.map((p) => (
                        <CommandItem
                          key={`product-${p.id}`}
                          value={`product-${p.name}`}
                          onSelect={() => {
                            setSelected({
                              type: "product",
                              id: p.id,
                              name: p.name,
                            });
                            setComboOpen(false);
                          }}
                        >
                          <ShoppingBasket className="size-3.5 text-amber-500" />
                          {p.name}
                          {selected?.id === p.id &&
                            selected.type === "product" && (
                              <Check className="ml-auto size-3.5" />
                            )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Recipes">
                      {recipes.map((r) => (
                        <CommandItem
                          key={`recipe-${r.id}`}
                          value={`recipe-${r.name}`}
                          onSelect={() => {
                            setSelected({
                              type: "recipe",
                              id: r.id,
                              name: r.name,
                            });
                            setComboOpen(false);
                          }}
                        >
                          <ChefHat className="size-3.5 text-pink-500" />
                          {r.name}
                          {selected?.id === r.id &&
                            selected.type === "recipe" && (
                              <Check className="ml-auto size-3.5" />
                            )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label>Quantity (g)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={quantityStr}
              onChange={(e) => setQuantityStr(e.target.value)}
              placeholder="e.g. 150"
            />
            {/* Serving options */}
            {servingOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {servingOptions.map((opt) => {
                  const isActive = parseFloat(quantityStr) === opt.weight_g;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setQuantityStr(String(opt.weight_g))}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all",
                        isActive
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
                          : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/50",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date + Time */}
          <div className="space-y-1.5">
            <Label>Date & Time</Label>
            <div className="flex items-center gap-2">
              {/* Native date picker */}
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1"
              />
              {/* Time: HH : MM */}
              <div className="flex items-center gap-1 shrink-0">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => setHour(e.target.value.padStart(2, "0"))}
                  className="w-13 text-center px-1"
                  placeholder="HH"
                />
                <span className="text-muted-foreground font-bold">:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value.padStart(2, "0"))}
                  className="w-13 text-center px-1"
                  placeholder="MM"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selected}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Add Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddFoodEntryButton({
  products,
  recipes,
  gymDay,
}: Omit<AddFoodEntryDialogProps, "open" | "onOpenChange">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Add Entry
      </Button>
      <AddFoodEntryDialog
        open={open}
        onOpenChange={setOpen}
        products={products}
        recipes={recipes}
        gymDay={gymDay}
      />
    </>
  );
}
