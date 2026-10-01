"use client";

import { Link as LinkIcon } from "lucide-react";
import {
  Stamp,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  FormGroup,
} from "@/app/components/ui";
import type { FormEvent } from "react";
import type { ActiveRoadmap } from "./daily-types";

export function AddDailyTaskModal({
  onClose,
  activeTabInModal,
  setActiveTabInModal,
  newTitle,
  setNewTitle,
  newDescription,
  setNewDescription,
  newDailySlot,
  setNewDailySlot,
  newPlannedHours,
  setNewPlannedHours,
  newPlannedMinutes,
  setNewPlannedMinutes,
  newPlannedSeconds,
  setNewPlannedSeconds,
  newStartTime,
  setNewStartTime,
  newEndTime,
  setNewEndTime,
  addRoutine,
  adding,
  roadmapsLoading,
  activeRoadmaps,
  linkedRoadmapIds,
  linkingRoadmap,
  unlinkingRoadmap,
  handleLinkRoadmap,
  handleUnlinkRoadmap,
}: {
  onClose: () => void;
  activeTabInModal: "personal" | "roadmap";
  setActiveTabInModal: (tab: "personal" | "roadmap") => void;
  newTitle: string;
  setNewTitle: (value: string) => void;
  newDescription: string;
  setNewDescription: (value: string) => void;
  newDailySlot: string;
  setNewDailySlot: (value: string) => void;
  newPlannedHours: number | "";
  setNewPlannedHours: (value: number | "") => void;
  newPlannedMinutes: number | "";
  setNewPlannedMinutes: (value: number | "") => void;
  newPlannedSeconds: number | "";
  setNewPlannedSeconds: (value: number | "") => void;
  newStartTime: string;
  setNewStartTime: (value: string) => void;
  newEndTime: string;
  setNewEndTime: (value: string) => void;
  addRoutine: (event: FormEvent<HTMLFormElement>) => void;
  adding: boolean;
  roadmapsLoading: boolean;
  activeRoadmaps: ActiveRoadmap[];
  linkedRoadmapIds: Set<string>;
  linkingRoadmap: string | null;
  unlinkingRoadmap: string | null;
  handleLinkRoadmap: (roadmapId: string) => void;
  handleUnlinkRoadmap: (roadmapId: string) => void;
}) {
  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card max-w-xl w-full max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground font-display">
                Add Daily Task
              </h3>
              <button
                onClick={onClose}
                className="text-graphite-muted hover:text-foreground text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border px-6">
              <button
                type="button"
                onClick={() => setActiveTabInModal("personal")}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTabInModal === "personal"
                    ? "border-primary text-foreground"
                    : "border-transparent text-graphite-muted hover:text-foreground"
                }`}
              >
                Personal Routine
              </button>
              <button
                type="button"
                onClick={() => setActiveTabInModal("roadmap")}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTabInModal === "roadmap"
                    ? "border-primary text-foreground"
                    : "border-transparent text-graphite-muted hover:text-foreground"
                }`}
              >
                From Active Roadmap
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTabInModal === "personal" ? (
                <form onSubmit={addRoutine} className="space-y-4">
                  <FormGroup label="Routine Title">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      placeholder="e.g. 30 min DSA Practice, Review Flashcards"
                      className="input"
                    />
                  </FormGroup>
                  <FormGroup label="Description (optional)">
                    <textarea
                      value={newDescription}
                      onChange={(event) =>
                        setNewDescription(event.target.value)
                      }
                      placeholder="What does this routine involve?"
                      className="input min-h-[80px]"
                      rows={3}
                    />
                  </FormGroup>
                  <FormGroup label="Daily Slot (optional)">
                    <select
                      value={newDailySlot}
                      onChange={(event) => setNewDailySlot(event.target.value)}
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
                          value={newPlannedHours ?? ""}
                          onChange={(event) =>
                            setNewPlannedHours(event.target.valueAsNumber || 0)
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
                          value={newPlannedMinutes ?? ""}
                          onChange={(event) =>
                            setNewPlannedMinutes(
                              event.target.valueAsNumber || 0,
                            )
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
                          value={newPlannedSeconds ?? ""}
                          onChange={(event) =>
                            setNewPlannedSeconds(
                              event.target.valueAsNumber || 0,
                            )
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
                        value={newStartTime}
                        onChange={(event) =>
                          setNewStartTime(event.target.value)
                        }
                        className="input"
                      />
                    </FormGroup>
                    <FormGroup label="End Time (optional)">
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(event) => setNewEndTime(event.target.value)}
                        className="input"
                      />
                    </FormGroup>
                  </div>
                  <p className="caption">
                    Personal routines repeat every day and help build strong
                    study habits.
                  </p>
                  <div className="pt-4 flex justify-end gap-3">
                    <SecondaryButton
                      onClick={() => {
                        onClose();
                        setNewTitle("");
                        setNewDescription("");
                        setNewDailySlot("");
                        setNewPlannedMinutes(60);
                        setNewStartTime("");
                        setNewEndTime("");
                      }}
                    >
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton
                      type="submit"
                      disabled={adding || !newTitle.trim()}
                    >
                      {adding ? "Adding..." : "Add Routine"}
                    </PrimaryButton>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-graphite-muted">
                    {
                      "Link a roadmap to automatically include its daily tasks in your workspace. Daily tasks from linked roadmaps will appear in your 'Focus Tasks' section."
                    }
                  </p>

                  {roadmapsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-16 bg-muted animate-pulse rounded-lg"
                        />
                      ))}
                    </div>
                  ) : activeRoadmaps.length === 0 ? (
                    <EmptyState
                      title="No active roadmaps"
                      description="Activate a roadmap from the Roadmap Library first"
                      action={
                        <SecondaryButton onClick={onClose}>
                          Browse Roadmaps
                        </SecondaryButton>
                      }
                    />
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {activeRoadmaps.map((roadmap) => {
                        const isLinked = linkedRoadmapIds.has(roadmap.id);
                        const isLinking = linkingRoadmap === roadmap.id;
                        const isUnlinking = unlinkingRoadmap === roadmap.id;

                        return (
                          <div
                            key={roadmap.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {roadmap.title}
                                </p>
                                {isLinked && <Stamp tone="valid">Linked</Stamp>}
                              </div>
                              {roadmap.description && (
                                <p className="mt-1 text-xs text-graphite-faint truncate">
                                  {roadmap.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-3 text-xs text-graphite-faint">
                                <span className="flex items-center gap-1">
                                  <LinkIcon className="h-3.5 w-3.5" />
                                  {roadmap.dailyTaskCount} daily tasks
                                </span>
                              </div>
                            </div>
                            {isLinked ? (
                              <SecondaryButton
                                onClick={() => handleUnlinkRoadmap(roadmap.id)}
                                disabled={isUnlinking}
                                className="shrink-0"
                              >
                                {isUnlinking ? "Unlinking..." : "Unlink"}
                              </SecondaryButton>
                            ) : (
                              <PrimaryButton
                                onClick={() => handleLinkRoadmap(roadmap.id)}
                                disabled={isLinking}
                                className="shrink-0"
                              >
                                {isLinking ? "Linking..." : "Link Roadmap"}
                              </PrimaryButton>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
);
}
