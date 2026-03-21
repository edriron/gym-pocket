'use client'

import { useState, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2, Search, LayoutList, LayoutGrid, ShoppingBasket, Flame, X, Dumbbell, Wheat, Droplets, Apple, Leaf, Milk, Beef, type LucideIcon } from 'lucide-react'
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
import { ProductDialog } from './ProductDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { updateProduct, deleteProduct } from '@/app/(protected)/products/actions'
import type { Product } from '@/types'
import type { ProductFormValues } from '@/lib/validations'

const VIEW_KEY = 'gym-pocket-products-view'

const MACRO_TAGS: { tag: string; icon: LucideIcon; iconColor: string; activeClasses: string }[] = [
  { tag: 'protein',  icon: Dumbbell, iconColor: 'text-blue-500 dark:text-blue-400',   activeClasses: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' },
  { tag: 'carb',     icon: Wheat,    iconColor: 'text-amber-500 dark:text-amber-400', activeClasses: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300' },
  { tag: 'fat',      icon: Droplets, iconColor: 'text-orange-500 dark:text-orange-400', activeClasses: 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300' },
]

const TYPE_TAGS: { tag: string; icon: LucideIcon; iconColor: string; activeClasses: string }[] = [
  { tag: 'fruit',     icon: Apple, iconColor: 'text-rose-500 dark:text-rose-400',    activeClasses: 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300' },
  { tag: 'vegetable', icon: Leaf,  iconColor: 'text-green-600 dark:text-green-400',  activeClasses: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300' },
  { tag: 'dairy',     icon: Milk,  iconColor: 'text-sky-400 dark:text-sky-300',      activeClasses: 'bg-sky-100 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300' },
  { tag: 'meat',      icon: Beef,  iconColor: 'text-red-700 dark:text-red-500',      activeClasses: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300' },
]

interface ProductsTableProps {
  products: Product[]
  currentUserId: string
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
  isOwner,
  onEdit,
  onDelete,
}: {
  product: Product
  imageUrl: string | null
  isOwner: boolean
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
}) {
  const serving = product.serving_size_g ?? 100
  const factor = serving / 100
  const cals = Math.round(product.calories * factor * 10) / 10
  const carbs = Math.round(product.carbs_g * factor * 10) / 10
  const prot = Math.round(product.protein_g * factor * 10) / 10
  const fats = Math.round(product.fats_g * factor * 10) / 10

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
          <span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">{cals}</span>
          <span className="text-xs text-muted-foreground">kcal</span>
          <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-0">
            {serving}g
          </Badge>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="bg-muted/50 rounded-lg py-1.5 px-1">
            <p className="text-xs font-semibold tabular-nums text-amber-700 dark:text-amber-400">{carbs}g</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">carbs</p>
          </div>
          <div className="bg-muted/50 rounded-lg py-1.5 px-1">
            <p className="text-xs font-semibold tabular-nums text-blue-700 dark:text-blue-400">{prot}g</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">protein</p>
          </div>
          <div className="bg-muted/50 rounded-lg py-1.5 px-1">
            <p className="text-xs font-semibold tabular-nums text-orange-700 dark:text-orange-400">{fats}g</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">fats</p>
          </div>
        </div>
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon-sm" className="size-7 shadow-sm">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        </div>
      )}
    </div>
  )
}

export function ProductsTable({ products, currentUserId }: ProductsTableProps) {
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [macroFilter, setMacroFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
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

  const filtered = products.filter((p) => {
    if (!p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (macroFilter.length > 0 && !macroFilter.every(t => (p.macro_tags ?? []).includes(t))) return false
    if (typeFilter && p.type_tag !== typeFilter) return false
    return true
  })

  async function handleUpdate(values: ProductFormValues) {
    if (!editProduct) return
    const result = await updateProduct(editProduct.id, values)
    if (result?.error) toast.error(result.error)
    else toast.success('Product updated')
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
                imageUrl={imageOverrides[product.id] !== undefined ? imageOverrides[product.id] : (product.image_url ?? null)}
                isOwner={product.created_by === currentUserId}
                onEdit={setEditProduct}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )
      ) : (
        /* List view */
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Name</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">kcal</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">Carbs</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">Protein</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">Fats</TableHead>
                <TableHead className="text-right hidden sm:table-cell font-semibold text-xs uppercase tracking-wide text-muted-foreground">Serving</TableHead>
                <TableHead className="w-12" />
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
                filtered.map((product) => (
                  <TableRow key={product.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/10">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center shrink-0 border">
                          {(imageOverrides[product.id] !== undefined ? imageOverrides[product.id] : product.image_url) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(imageOverrides[product.id] !== undefined ? imageOverrides[product.id] : product.image_url)!} alt="" className="size-full object-cover" />
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
                    <TableCell className="text-right tabular-nums font-medium text-red-600 dark:text-red-400">{product.calories}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-700 dark:text-amber-400">{product.carbs_g}g</TableCell>
                    <TableCell className="text-right tabular-nums text-blue-700 dark:text-blue-400">{product.protein_g}g</TableCell>
                    <TableCell className="text-right tabular-nums text-orange-700 dark:text-orange-400">{product.fats_g}g</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {product.serving_size_g ? (
                        <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-0">
                          {product.serving_size_g}g
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">per 100g</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.created_by === currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setEditProduct(product)}
                            >
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
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
