"use client";

import { Dialog, PrimaryButton, SecondaryButton } from "@/app/components/ui";
import type { Routine } from "./daily-types";

export function DeleteRoutineDialog({
  deletingRoutine,
  onClose,
  handleDeleteRoutine,
  updating,
}: {
  deletingRoutine: Routine | null;
  onClose: () => void;
  handleDeleteRoutine: () => void;
  updating: string | null;
}) {
  return (
      <Dialog
        open={!!deletingRoutine}
        onClose={onClose}
        title="Delete Routine"
        description="This will permanently remove the routine and its history."
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete{" "}
            <strong className="font-medium">{deletingRoutine?.title}</strong>?
            This cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <SecondaryButton onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleDeleteRoutine}
              disabled={!!updating}
              className="btn-destructive"
            >
              {updating ? "Deleting..." : "Delete Routine"}
            </PrimaryButton>
          </div>
        </div>
      </Dialog>
);
}
