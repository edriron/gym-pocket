'use client'

import { useState, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2, Search, LayoutList, LayoutGrid, ShoppingBasket, Flame, X, Eye } from 'lucide-react'
import { MACRO_TAG_CONFIG, TYPE_TAG_CONFIG } from '@/lib/product-tags'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProductDialog } from './ProductDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { updateProduct, deleteProduct } from '@/app/(protected)/products/actions'
import type { Product } from '@/types'
import type { ProductFormValues } from '@/lib/validations'

const VIEW_KEY = 'gym-pocket-products-view'

const MACRO_TAGS = MACRO_TAG_CONFIG
const TYPE_TAGS  = TYPE_TAG_CONFIG

interface ProductsTableProps {
  products: Product[]
  currentUserId: string
  isAdmin?: boolean
}

function ProductImageArea({ imageUrl }: { imageUrl: string | null }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  // Reset state when imageUrl changes
  useEffect(() => { setLoaded(false); setErrored(false) }, [imageUrl])

  const showImage = imageUrl && !errored

  return (
    <div className="aspect-square border-b overflow-hidden relative">
      {/* Neutral placeholder shown while loading or when no image */}
      <div
        className={`absolute inset-0 bg-muted/40 flex items-center justify-center transition-opacity duration-300 ${
          showImage && loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <ShoppingBasket className="size-8 text-muted-foreground/30" />
      </div>
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Product"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`size-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}

function ProductCard({
  product,
  imageUrl,
  activeServingG,
  isOwner,
  onView,
  onEdit,
  onDelete,
  onToggleServing,
}: {
  product: Product
  imageUrl: string | null
  activeServingG: number | undefined
  isOwner: boolean
  onView: (p: Product) => void
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
  onToggleServing: () => void
}) {
  const n = calcNutrition(product, activeServingG ?? 100)

  return (
    <div className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200">
      {/* Image area */}
      <ProductImageArea imageUrl={imageUrl} />

      {/* Content */}
      <div className="p-3 space-y-2.5">
        <div className="min-h-10">
          <p className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
          )}
        </div>

        {/* Calories */}
        <div className="flex items-center gap-1.5">
          <Flame className="size-3.5 text-red-500 shrink-0" />
          <span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">{n.calories}</span>
          <span className="text-xs text-muted-foreground">kcal</span>
          <span className="ml-auto">
            <ServingBadge product={product} activeG={activeServingG} onToggle={onToggleServing} />
          </span>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="bg-muted/50 rounded-lg py-1.5 px-1">
            <p className="text-xs font-semibold tabular-nums text-amber-700 dark:text-amber-400">{n.carbs_g}g</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">carbs</p>
          </div>
          <div className="bg-muted/50 rounded-lg py-1.5 px-1">
            <p className="text-xs font-semibold tabular-nums text-blue-700 dark:text-blue-400">{n.protein_g}g</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">protein</p>
          </div>
          <div className="bg-muted/50 rounded-lg py-1.5 px-1">
            <p className="text-xs font-semibold tabular-nums text-orange-700 dark:text-orange-400">{n.fats_g}g</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">fats</p>
          </div>
        </div>
      </div>

      {/* Owner actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isOwner ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon-sm" className="size-7 shadow-sm">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2" onClick={() => onView(product)}>
                <Eye className="size-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => onEdit(product)}>
                <Pencil className="size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onClick={() => onDelete(product.id)}
              >
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="secondary" size="icon-sm" className="size-7 shadow-sm" onClick={() => onView(product)} title="View product">
            <Eye className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

// activeServing[productId] = weight_g currently selected (undefined = 100g default)
type ServingState = Record<string, number | undefined>

function calcNutrition(p: Product, weightG: number) {
  const f = weightG / 100
  return {
    calories: Math.round(p.calories * f * 10) / 10,
    carbs_g:  Math.round(p.carbs_g  * f * 10) / 10,
    protein_g: Math.round(p.protein_g * f * 10) / 10,
    fats_g:   Math.round(p.fats_g   * f * 10) / 10,
  }
}

// Cycle through: 100g → option[0] → option[1] → … → 100g
function cycleServing(p: Product, current: number | undefined): number | undefined {
  const opts = p.serving_options ?? []
  if (opts.length === 0) return undefined
  if (current === undefined) return opts[0].weight_g
  const idx = opts.findIndex(o => o.weight_g === current)
  if (idx === -1 || idx === opts.length - 1) return undefined
  return opts[idx + 1].weight_g
}

function ServingBadge({ product, activeG, onToggle }: { product: Product; activeG: number | undefined; onToggle: () => void }) {
  const opts = product.serving_options ?? []
  const hasOpts = opts.length > 0
  const label = activeG !== undefined
    ? (opts.find(o => o.weight_g === activeG)?.label ?? `${activeG}g`)
    : '100g'

  if (!hasOpts) {
    return <span className="text-muted-foreground text-xs">100g</span>
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      title="Click to toggle serving size"
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-0 px-2 py-0.5 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors cursor-pointer"
    >
      {label}
    </button>
  )
}

export function ProductsTable({ products, currentUserId, isAdmin = false }: ProductsTableProps) {
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [macroFilter, setMacroFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [activeServings, setActiveServings] = useState<ServingState>({})
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  // Local image overrides so card/list updates immediately after upload without a page refresh
  const [imageOverrides, setImageOverrides] = useState<Record<string, string | null>>({})

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY)
    if (saved === 'grid' || saved === 'list') setView(saved)
  }, [])

  function toggleView(v: 'list' | 'grid') {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }

  function toggleServing(product: Product) {
    setActiveServings(prev => ({
      ...prev,
      [product.id]: cycleServing(product, prev[product.id]),
    }))
  }

  const filtered = products.filter((p) => {
    if (!p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (macroFilter.length > 0 && !macroFilter.every(t => (p.macro_tags ?? []).includes(t))) return false
    if (typeFilter && p.type_tag !== typeFilter) return false
    return true
  })

  async function handleUpdate(values: ProductFormValues) {
    if (!editProduct) return
    const result = await updateProduct(editProduct.id, values)
    if (result?.error) { toast.error(result.error); return { error: result.error } }
    toast.success('Product updated')
    return undefined
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteProduct(deleteId)
    if (result?.error) toast.error(result.error)
    else toast.success('Product deleted')
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn('pl-9', search && 'pr-9')}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center rounded-lg border bg-muted/40 p-1 gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className={view === 'list' ? 'bg-background shadow-sm text-amber-600 dark:text-amber-400' : 'text-muted-foreground hover:text-foreground'}
            onClick={() => toggleView('list')}
            title="List view"
          >
            <LayoutList className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className={view === 'grid' ? 'bg-background shadow-sm text-amber-600 dark:text-amber-400' : 'text-muted-foreground hover:text-foreground'}
            onClick={() => toggleView('grid')}
            title="Card view"
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {MACRO_TAGS.map(({ tag, icon: Icon, iconColor, activeClasses }) => {
          const active = macroFilter.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setMacroFilter(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all capitalize',
                active ? activeClasses : 'border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40'
              )}
            >
              <Icon className={cn('size-3', active ? iconColor : 'text-muted-foreground/60')} />
              {tag}
            </button>
          )
        })}
        <div className="w-px h-4 bg-border mx-1" />
        {TYPE_TAGS.map(({ tag, icon: Icon, iconColor, activeClasses }) => {
          const active = typeFilter === tag
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setTypeFilter(active ? null : tag)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all capitalize',
                active ? activeClasses : 'border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40'
              )}
            >
              <Icon className={cn('size-3', active ? iconColor : 'text-muted-foreground/60')} />
              {tag}
            </button>
          )
        })}
        {(macroFilter.length > 0 || typeFilter) && (
          <button
            type="button"
            onClick={() => { setMacroFilter([]); setTypeFilter(null) }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Grid view */}
      {view === 'grid' ? (
        filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {search ? 'No products match your search.' : 'No products yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                activeServingG={activeServings[product.id]}
                imageUrl={imageOverrides[product.id] !== undefined ? imageOverrides[product.id] : (product.image_url ?? null)}
                isOwner={product.created_by === currentUserId || isAdmin}
                onView={setViewProduct}
                onEdit={setEditProduct}
                onDelete={setDeleteId}
                onToggleServing={() => toggleServing(product)}
              />
            ))}
          </div>
        )
      ) : (
        /* List view */
        <div className="rounded-xl border overflow-hidden">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Name</TableHead>
                <TableHead className="w-16 text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">kcal</TableHead>
                <TableHead className="w-20 text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">Carbs</TableHead>
                <TableHead className="w-20 text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">Protein</TableHead>
                <TableHead className="w-16 text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">Fats</TableHead>
                <TableHead className="w-24 text-right hidden sm:table-cell font-semibold text-xs uppercase tracking-wide text-muted-foreground">Serving</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {search ? 'No products match your search.' : 'No products yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => {
                  const activeG = activeServings[product.id]
                  const n = calcNutrition(product, activeG ?? 100)
                  const imgSrc = imageOverrides[product.id] !== undefined ? imageOverrides[product.id] : product.image_url
                  return (
                  <TableRow key={product.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/10">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center shrink-0 border">
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgSrc} alt="" className="size-full object-cover" />
                          ) : (
                            <ShoppingBasket className="size-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium">{product.name}</span>
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-red-600 dark:text-red-400">{n.calories}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-700 dark:text-amber-400">{n.carbs_g}g</TableCell>
                    <TableCell className="text-right tabular-nums text-blue-700 dark:text-blue-400">{n.protein_g}g</TableCell>
                    <TableCell className="text-right tabular-nums text-orange-700 dark:text-orange-400">{n.fats_g}g</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <ServingBadge product={product} activeG={activeG} onToggle={() => toggleServing(product)} />
                    </TableCell>
                    <TableCell>
                      {product.created_by === currentUserId || isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => setViewProduct(product)}>
                              <Eye className="size-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => setEditProduct(product)}>
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(product.id)}
                            >
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewProduct(product)} title="View product">
                          <Eye className="size-4 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View-only product dialog */}
      <Dialog open={!!viewProduct} onOpenChange={(o) => !o && setViewProduct(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewProduct?.name}
            </DialogTitle>
          </DialogHeader>
          {viewProduct && (() => {
            const activeG = activeServings[viewProduct.id]
            const n = calcNutrition(viewProduct, activeG ?? 100)
            const imgSrc = imageOverrides[viewProduct.id] !== undefined ? imageOverrides[viewProduct.id] : viewProduct.image_url
            return (
              <div className="space-y-4">
                {imgSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgSrc} alt="" className="w-full aspect-video object-cover rounded-lg border" />
                )}
                {viewProduct.description && (
                  <p className="text-sm text-muted-foreground">{viewProduct.description}</p>
                )}
                <div className="rounded-lg border divide-y">
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Calories</span>
                    <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">{n.calories} kcal</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Carbs</span>
                    <span className="tabular-nums text-amber-700 dark:text-amber-400">{n.carbs_g}g</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Protein</span>
                    <span className="tabular-nums text-blue-700 dark:text-blue-400">{n.protein_g}g</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Fats</span>
                    <span className="tabular-nums text-orange-700 dark:text-orange-400">{n.fats_g}g</span>
                  </div>
                </div>
                {(viewProduct.serving_options ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Serving options</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewProduct.serving_options.map((opt) => (
                        <span key={opt.label} className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-xs font-medium">
                          {opt.label} · {opt.weight_g}g
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      <ProductDialog
        open={!!editProduct}
        onOpenChange={(o) => !o && setEditProduct(null)}
        product={editProduct}
        onSubmit={handleUpdate}
        onImageUpdate={(id, url) => setImageOverrides((prev) => ({ ...prev, [id]: url }))}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete product?"
        description="This will permanently delete the product. It cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  )
}
