"use client";

import { Dialog } from "@/app/components/ui";
import { PrimaryButton, SecondaryButton } from "@/app/components/ui";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TaskCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onKeepTask: () => void;
  task: {
    title: string;
    description?: string | null;
    plannedSeconds: number;
  };
}

export function TaskCompletionDialog({ open, onClose, onConfirm, onKeepTask, task }: TaskCompletionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Task Completed?"
      description={`You've reached the end of your timer for "${task.title}". Would you like to mark this task as done?`}
    >
      <div className="space-y-4">
        {task.description && (
          <p className="text-sm text-graphite-muted italic">
            "{task.description}"
          </p>
        )}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Timer: {Math.floor(task.plannedSeconds / 60)}m {task.plannedSeconds % 60}s</p>
            <p className="text-graphite-faint">Elapsed time will be recorded</p>
          </div>
        </div>
        <p className="text-sm text-graphite-muted">
          Once marked done, this cannot be undone.
        </p>
        <div className="pt-2 flex gap-3">
          <SecondaryButton onClick={onKeepTask} className="flex-1">
            <XCircle className="w-4 h-4 mr-2" />
            Keep Task
          </SecondaryButton>
          <PrimaryButton onClick={onConfirm} className="flex-1">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Done
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}

interface KeepTaskWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  taskTitle: string;
}

export function KeepTaskWarningDialog({ open, onClose, onReset, taskTitle }: KeepTaskWarningDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Keep Task Unfinished?"
      description={`The timer has finished for "${taskTitle}", but this task will remain incomplete.`}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber/5 border border-amber/20">
          <AlertCircle className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-foreground">
            <p className="font-medium">This will reset the task timer to its original duration.</p>
            <p className="mt-1 text-graphite-muted">You can start it again later from any page.</p>
          </div>
        </div>
        <div className="pt-2 flex gap-3">
          <SecondaryButton onClick={onClose} className="flex-1">
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={onReset}
            className="flex-1 btn-destructive"
          >
            Reset Task
          </PrimaryButton>
        </div>
      </div>
    </Dialog>
  );
}