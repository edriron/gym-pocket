'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react'
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

interface ProductsTableProps {
  products: Product[]
  currentUserId: string
}

export function ProductsTable({ products, currentUserId }: ProductsTableProps) {
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">kcal</TableHead>
              <TableHead className="text-right">Carbs</TableHead>
              <TableHead className="text-right">Protein</TableHead>
              <TableHead className="text-right">Fats</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Serving</TableHead>
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
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{product.name}</span>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{product.calories}</TableCell>
                  <TableCell className="text-right tabular-nums">{product.carbs_g}g</TableCell>
                  <TableCell className="text-right tabular-nums">{product.protein_g}g</TableCell>
                  <TableCell className="text-right tabular-nums">{product.fats_g}g</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {product.serving_size_g ? (
                      <Badge variant="secondary">{product.serving_size_g}g</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
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

      <ProductDialog
        open={!!editProduct}
        onOpenChange={(o) => !o && setEditProduct(null)}
        product={editProduct}
        onSubmit={handleUpdate}
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
