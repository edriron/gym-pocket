'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { MoreHorizontal, Pencil, Trash2, Share2, ExternalLink, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
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
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 border hover:border-emerald-200 dark:hover:border-emerald-800/60">
        {/* Emerald top accent bar */}
        <div className="h-1 w-full bg-linear-to-r from-emerald-500 to-teal-400" />

        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-0 right-0 size-28 rounded-full bg-emerald-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

        <CardContent className="relative pt-4 pb-4">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/diet/${table.id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                {table.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(table.created_at), 'MMM d, yyyy')}
              </p>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              {!isOwner && accessMode && (
                <Badge
                  variant={accessMode === 'edit' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {accessMode === 'edit' ? 'Edit' : 'View'}
                </Badge>
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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

          {shareCount > 0 && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              <span>Shared with {shareCount} {shareCount === 1 ? 'person' : 'people'}</span>
            </div>
          )}
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
