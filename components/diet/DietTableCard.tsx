'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { MoreHorizontal, Pencil, Trash2, Share2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ShareTableDialog } from './ShareTableDialog'
import { deleteDietTable } from '@/app/(protected)/diet/actions'
import type { DietTable, TableShare } from '@/types'

interface DietTableCardProps {
  table: DietTable
  isOwner: boolean
  accessMode?: 'view' | 'edit'
  shareCount?: number
  shares?: (TableShare & { profile: { email: string; full_name: string | null } })[]
}

export function DietTableCard({
  table,
  isOwner,
  accessMode,
  shareCount = 0,
  shares = [],
}: DietTableCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  async function handleDelete() {
    const result = await deleteDietTable(table.id)
    if (result?.error) toast.error(result.error)
    else toast.success('Diet table deleted')
  }

  return (
    <>
      <Card className="group relative hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/diet/${table.id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate hover:underline">{table.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(table.created_at), 'MMM d, yyyy')}
              </p>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              {!isOwner && accessMode && (
                <Badge variant={accessMode === 'edit' ? 'default' : 'secondary'} className="text-xs">
                  {accessMode === 'edit' ? 'Edit' : 'View'}
                </Badge>
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild className="gap-2">
                      <Link href={`/diet/${table.id}`}>
                        <ExternalLink className="size-4" /> Open
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => setShareOpen(true)}>
                      <Share2 className="size-4" /> Share
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="size-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <Link href={`/diet/${table.id}`} className="block">
            {shareCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Shared with {shareCount} {shareCount === 1 ? 'person' : 'people'}
              </p>
            )}
          </Link>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${table.name}"?`}
        description="All sections and rows will be permanently deleted."
        onConfirm={handleDelete}
      />

      {isOwner && (
        <ShareTableDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          tableId={table.id}
          tableType="diet"
          existingShares={shares}
          actionPath={`/diet/${table.id}`}
        />
      )}
    </>
  )
}
