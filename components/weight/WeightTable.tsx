'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import { WeightDialog } from './WeightDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { deleteWeightRecord, updateWeightRecord } from '@/app/(protected)/weight/actions'
import type { WeightRecord } from '@/types'
import type { WeightFormValues } from '@/lib/validations'

interface WeightTableProps {
  records: WeightRecord[]
}

export function WeightTable({ records }: WeightTableProps) {
  const [editRecord, setEditRecord] = useState<WeightRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleUpdate(values: WeightFormValues) {
    if (!editRecord) return
    const result = await updateWeightRecord(editRecord.id, values)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Weight record updated')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteWeightRecord(deleteId)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Record deleted')
    }
    setDeleteId(null)
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  No records yet. Add your first weight entry.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {format(parseISO(record.recorded_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{record.weight_kg} kg</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => setEditRecord(record)}
                        >
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(record.id)}
                        >
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <WeightDialog
        open={!!editRecord}
        onOpenChange={(o) => !o && setEditRecord(null)}
        record={editRecord}
        onSubmit={handleUpdate}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete weight record?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  )
}
