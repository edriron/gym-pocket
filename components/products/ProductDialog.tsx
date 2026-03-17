'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  Search,
  ShoppingBasket,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { productSchema, type ProductFormValues } from '@/lib/validations'
import {
  fetchAndUploadProductImage,
  saveProductImageUrl,
  deleteProductImage,
} from '@/app/(protected)/products/actions'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSubmit: (values: ProductFormValues) => Promise<void>
}

const DEFAULT_VALUES: ProductFormValues = {
  name: '',
  description: '',
  calories: 0,
  carbs_g: 0,
  protein_g: 0,
  fats_g: 0,
  serving_size_g: null,
}

// ── Food image search (proxied through our API to avoid CORS) ──
type FoodResult = { name: string; thumb: string; imageUrl: string }

async function searchFoodDatabase(query: string): Promise<FoodResult[]> {
  const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`, {
    signal: AbortSignal.timeout(25_000),
  })
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

// ── Image section (edit mode only) ────────────────────────────
function ImageSection({
  product,
  currentImageUrl,
  onImageChange,
}: {
  product: Product
  currentImageUrl: string | null
  onImageChange: (url: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // File upload
  const fileRef = useRef<HTMLInputElement>(null)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.storage
        .from('product-images')
        .upload(product.id, file, { upsert: true, contentType: file.type })
      if (error) { toast.error(error.message); return }
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(product.id)
      const res = await saveProductImageUrl(product.id, publicUrl)
      if (res?.error) { toast.error(res.error); return }
      onImageChange(publicUrl)
      toast.success('Image uploaded')
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // URL fetch
  const [urlInput, setUrlInput] = useState('')
  async function handleUrlFetch() {
    if (!urlInput.trim()) return
    setLoading(true)
    try {
      const res = await fetchAndUploadProductImage(product.id, urlInput.trim())
      if ('error' in res) { toast.error(res.error); return }
      onImageChange(res.publicUrl)
      setUrlInput('')
      toast.success('Image uploaded')
    } finally {
      setLoading(false)
    }
  }

  // Food search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await searchFoodDatabase(searchQuery.trim())
      setSearchResults(results)
      if (results.length === 0) toast.info('No results found.')
    } catch {
      toast.error('Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }
  async function handlePickSearchResult(imageUrl: string) {
    setLoading(true)
    try {
      const res = await fetchAndUploadProductImage(product.id, imageUrl)
      if ('error' in res) { toast.error(res.error); return }
      onImageChange(res.publicUrl)
      setSearchResults([])
      setSearchQuery('')
      toast.success('Image uploaded')
    } finally {
      setLoading(false)
    }
  }

  // Delete image
  async function handleDelete() {
    setLoading(true)
    try {
      const res = await deleteProductImage(product.id)
      if (res?.error) { toast.error(res.error); return }
      onImageChange(null)
      toast.success('Image removed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <ImageIcon className="size-4" />
          Product Image
          {currentImageUrl && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
              Set
            </span>
          )}
        </span>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-xl border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
              {currentImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImageUrl}
                  alt="Product"
                  className="size-full object-cover"
                />
              ) : (
                <ShoppingBasket className="size-8 text-muted-foreground/40" />
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Upload a photo to show in the card view.</p>
              <p>Max 5 MB — JPEG, PNG, WebP or GIF.</p>
              {currentImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-7 px-2 -ml-2"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="size-3.5 mr-1" /> Remove image
                </Button>
              )}
            </div>
          </div>

          {/* Upload tabs */}
          <Tabs defaultValue="upload">
            <TabsList className="w-full grid grid-cols-3 h-8 text-xs">
              <TabsTrigger value="upload" className="text-xs">
                <Upload className="size-3 mr-1" /> Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs">URL</TabsTrigger>
              <TabsTrigger value="search" className="text-xs">
                <Search className="size-3 mr-1" /> Search
              </TabsTrigger>
            </TabsList>

            {/* Upload from file */}
            <TabsContent value="upload" className="mt-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => fileRef.current?.click()}
              >
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
                Choose file from PC
              </Button>
            </TabsContent>

            {/* From URL */}
            <TabsContent value="url" className="mt-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlFetch())}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUrlFetch}
                  disabled={loading || !urlInput.trim()}
                  className="shrink-0"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : 'Fetch'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The server will download and store the image.
              </p>
            </TabsContent>

            {/* Food database search */}
            <TabsContent value="search" className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. banana, oats, chicken"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                  disabled={searching || loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={searching || loading || !searchQuery.trim()}
                  className="shrink-0"
                >
                  {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={loading}
                      onClick={() => handlePickSearchResult(r.imageUrl)}
                      className="group relative rounded-lg overflow-hidden border aspect-square bg-muted/30 hover:border-amber-400 hover:ring-2 hover:ring-amber-400/20 transition-all disabled:opacity-50"
                      title={r.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.thumb}
                        alt={r.name}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                      {loading && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <Loader2 className="size-4 animate-spin" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Powered by{' '}
                <a
                  href="https://world.openfoodfacts.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  Open Food Facts
                </a>
                . Click any result to use it.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

// ── Main dialog ────────────────────────────────────────────────
export function ProductDialog({ open, onOpenChange, product, onSubmit }: ProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const isEdit = !!product

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        product
          ? {
              name: product.name,
              description: product.description ?? '',
              calories: product.calories,
              carbs_g: product.carbs_g,
              protein_g: product.protein_g,
              fats_g: product.fats_g,
              serving_size_g: product.serving_size_g,
            }
          : DEFAULT_VALUES
      )
      setCurrentImageUrl(product?.image_url ?? null)
    }
  }, [open, product, form])

  async function handleSubmit(values: ProductFormValues) {
    setLoading(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Oats, Chicken Breast" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Nutrition per 100g
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories (kcal)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carbs_g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carbs (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="protein_g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fats_g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fats (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serving_size_g"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serving Size (g) — optional</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 30 for a scoop"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional: define a common serving size in grams
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image section — edit only */}
            {isEdit && product && (
              <ImageSection
                product={product}
                currentImageUrl={currentImageUrl}
                onImageChange={setCurrentImageUrl}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Add Product'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
