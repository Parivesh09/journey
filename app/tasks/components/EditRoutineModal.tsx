"use client";

import {
  Dialog,
  PrimaryButton,
  SecondaryButton,
  FormGroup,
  Input,
  Caption,
} from "@/app/components/ui";
import type { FormEvent } from "react";
import type { Routine } from "./daily-types";

export function EditRoutineModal({
  editingRoutine,
  onClose,
  onCancel,
  handleEditRoutine,
  updating,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editDailySlot,
  setEditDailySlot,
  editPlannedHours,
  setEditPlannedHours,
  editPlannedMinutes,
  setEditPlannedMinutes,
  editPlannedSeconds,
  setEditPlannedSeconds,
  editStartTime,
  setEditStartTime,
  editEndTime,
  setEditEndTime,
}: {
  editingRoutine: Routine | null;
  onClose: () => void;
  onCancel: () => void;
  handleEditRoutine: (event: FormEvent<HTMLFormElement>) => void;
  updating: string | null;
  editTitle: string;
  setEditTitle: (value: string) => void;
  editDescription: string;
  setEditDescription: (value: string) => void;
  editDailySlot: string;
  setEditDailySlot: (value: string) => void;
  editPlannedHours: number | "";
  setEditPlannedHours: (value: number | "") => void;
  editPlannedMinutes: number | "";
  setEditPlannedMinutes: (value: number | "") => void;
  editPlannedSeconds: number | "";
  setEditPlannedSeconds: (value: number | "") => void;
  editStartTime: string;
  setEditStartTime: (value: string) => void;
  editEndTime: string;
  setEditEndTime: (value: string) => void;
}) {
  return (
      <Dialog
        open={!!editingRoutine}
        onClose={onClose}
        title="Edit Routine"
      >
        <form onSubmit={handleEditRoutine} className="space-y-4">
          <FormGroup label="Routine Title">
            <Input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. 30 min DSA Practice"
            />
          </FormGroup>
          <FormGroup label="Description (optional)">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="What does this routine involve?"
              className="input min-h-[80px]"
              rows={3}
            />
          </FormGroup>
          <FormGroup label="Daily Slot (optional)">
            <select
              value={editDailySlot}
              onChange={(e) => setEditDailySlot(e.target.value)}
              className="input"
            >
              <option value="">None</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </FormGroup>
          <FormGroup label="Planned Time">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label text-xs">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={editPlannedHours ?? ""}
                  onChange={(event) =>
                    setEditPlannedHours(event.target.valueAsNumber || 0)
                  }
                  className="input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label text-xs">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editPlannedMinutes ?? ""}
                  onChange={(event) =>
                    setEditPlannedMinutes(event.target.valueAsNumber || 0)
                  }
                  className="input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label text-xs">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editPlannedSeconds ?? ""}
                  onChange={(event) =>
                    setEditPlannedSeconds(event.target.valueAsNumber || 0)
                  }
                  className="input"
                  placeholder="0"
                />
              </div>
            </div>
          </FormGroup>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Start Time (optional)">
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="input"
              />
            </FormGroup>
            <FormGroup label="End Time (optional)">
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="input"
              />
            </FormGroup>
          </div>
          <Caption>Changes apply to this routine going forward.</Caption>
          <div className="pt-4 flex justify-end gap-3">
            <SecondaryButton onClick={onCancel}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={!!updating || !editTitle.trim()}
            >
              {updating ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        </form>
      </Dialog>
);
}
