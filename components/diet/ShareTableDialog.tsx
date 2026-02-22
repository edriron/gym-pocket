'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { shareSchema, type ShareFormValues } from '@/lib/validations'
import { shareTable, removeShare } from '@/app/(protected)/diet/actions'
import type { TableShare } from '@/types'

interface ShareTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableId: string
  tableType: 'diet' | 'workout'
  existingShares: (TableShare & { profile: { email: string; full_name: string | null } })[]
  actionPath: string
}

export function ShareTableDialog({
  open,
  onOpenChange,
  tableId,
  tableType,
  existingShares,
  actionPath,
}: ShareTableDialogProps) {
  const [loading, setLoading] = useState(false)
  const [shares, setShares] = useState(existingShares)

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: { email: '', access_mode: 'view' },
  })

  async function handleShare(values: ShareFormValues) {
    setLoading(true)
    try {
      const result = await shareTable(tableId, tableType, values)
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.share) {
        setShares((prev) => [...prev, result.share as any])
        toast.success(`Shared with ${values.email}`)
        form.reset()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(shareId: string) {
    const result = await removeShare(shareId)
    if (result?.error) toast.error(result.error)
    else {
      setShares((prev) => prev.filter((s) => s.id !== shareId))
      toast.success('Share removed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" /> Share Table
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleShare)} className="space-y-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Share with (email)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="access_mode"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Access</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="view">View only</SelectItem>
                        <SelectItem value="edit">Can edit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Share
            </Button>
          </form>
        </Form>

        {shares.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Shared with
              </p>
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {share.profile?.full_name ?? share.profile?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{share.profile?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={share.access_mode === 'edit' ? 'default' : 'secondary'}>
                      {share.access_mode}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemove(share.id)}
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
