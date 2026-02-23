"use client";

import { useState } from "react";
import { Plus, Share2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShareTableDialog } from "@/components/diet/ShareTableDialog";
import { WorkoutExerciseRow } from "./WorkoutExerciseRow";
import {
  addWorkoutExercise,
  renameWorkoutTable,
} from "@/app/(protected)/workout/actions";
import {
  workoutExerciseSchema,
  type WorkoutExerciseFormValues,
} from "@/lib/validations";
import type { WorkoutTableWithExercises, TableShare } from "@/types";

interface WorkoutTableEditorProps {
  table: WorkoutTableWithExercises;
  canEdit: boolean;
  isOwner: boolean;
  shares: (TableShare & {
    profile: { email: string; full_name: string | null };
  })[];
}

export function WorkoutTableEditor({
  table,
  canEdit,
  isOwner,
  shares,
}: WorkoutTableEditorProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [tableName, setTableName] = useState(table.name);
  const [editingName, setEditingName] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);

  const addForm = useForm<WorkoutExerciseFormValues>({
    resolver: zodResolver(workoutExerciseSchema),
    defaultValues: { name: "", sets: 3, reps: 10, calories: null },
  });

  const totalCalories = table.workout_exercises
    .filter((e) => e.calories != null)
    .reduce((sum, e) => sum + (e.calories ?? 0), 0);

  async function handleRenameTable() {
    if (tableName === table.name) {
      setEditingName(false);
      return;
    }
    const result = await renameWorkoutTable(table.id, tableName);
    if (result?.error) toast.error(result.error);
    setEditingName(false);
  }

  async function handleAddExercise(values: WorkoutExerciseFormValues) {
    const result = await addWorkoutExercise(
      table.id,
      values,
      table.workout_exercises.length,
    );
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Exercise added");
      addForm.reset({ name: "", sets: 3, reps: 10, calories: null });
      setShowAddRow(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Table header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          {editingName && canEdit ? (
            <Input
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              onBlur={handleRenameTable}
              onKeyDown={(e) => e.key === "Enter" && handleRenameTable()}
              autoFocus
              className="text-2xl font-bold h-10 max-w-xs"
            />
          ) : (
            <h1
              className={`text-2xl font-bold truncate ${canEdit ? "cursor-pointer hover:underline" : ""}`}
              onClick={() => canEdit && setEditingName(true)}
              title={canEdit ? "Click to rename" : undefined}
            >
              {tableName}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-4" /> Share
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setShowAddRow(true)}
            >
              <Plus className="size-4" /> Add Exercise
            </Button>
          )}
        </div>
      </div>

      {/* Exercises table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead className="text-center w-20">Sets</TableHead>
              <TableHead className="text-center w-20">Reps</TableHead>
              <TableHead className="text-center w-28">Calories</TableHead>
              {canEdit && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add new exercise inline row */}
            {showAddRow && canEdit && (
              <TableRow>
                <TableCell>
                  <Input
                    {...addForm.register("name")}
                    className="h-7 text-sm"
                    placeholder="Exercise name"
                    autoFocus
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    {...addForm.register("sets", { valueAsNumber: true })}
                    className="h-7 w-16 text-sm text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    {...addForm.register("reps", { valueAsNumber: true })}
                    className="h-7 w-16 text-sm text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.1"
                    {...addForm.register("calories", { valueAsNumber: true })}
                    className="h-7 w-20 text-sm text-center"
                    placeholder="optional"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={addForm.handleSubmit(handleAddExercise)}
                    >
                      <Plus className="size-4" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setShowAddRow(false)}
                    >
                      ✕
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {table.workout_exercises.length === 0 && !showAddRow ? (
              <TableRow>
                <td
                  colSpan={canEdit ? 5 : 4}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {canEdit
                    ? 'No exercises yet. Click "Add Exercise" to get started.'
                    : "No exercises added."}
                </td>
              </TableRow>
            ) : (
              [...table.workout_exercises]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((exercise) => (
                  <WorkoutExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    workoutTableId={table.id}
                    canEdit={canEdit}
                  />
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total calories */}
      {totalCalories > 0 && (
        <div className="flex items-center justify-end gap-2 rounded-lg bg-primary/10 px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">
            Total estimated burn:
          </span>
          <span className="text-base font-bold text-primary">
            {totalCalories.toFixed(0)} kcal
          </span>
        </div>
      )}

      {isOwner && (
        <ShareTableDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          tableId={table.id}
          tableType="workout"
          existingShares={shares}
          actionPath={`/workout/${table.id}`}
        />
      )}
    </div>
  );
}
