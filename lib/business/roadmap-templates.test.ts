import { describe, expect, it } from "vitest";

import { readRoadmap, validateRoadmapTemplate } from "./roadmap-templates";

describe("validateRoadmapTemplate", () => {
  it("accepts the configured roadmap templates", () => {
    for (const id of ["fullstack-v1", "sde-master-roadmap"]) {
      const errors = validateRoadmapTemplate(readRoadmap(id));
      expect(errors).toEqual([]);
    }
  });

  it("flags prerequisites that reference unknown milestones", () => {
    const template = readRoadmap("fullstack-v1");
    const broken = {
      ...template,
      milestones: [
        ...template.milestones,
        {
          id: "m-broken",
          title: "Broken",
          phases: [],
          prerequisites: ["m-does-not-exist"],
        },
      ],
    };
    const errors = validateRoadmapTemplate(broken);
    expect(errors).toContain(
      "milestone m-broken references unknown prerequisite m-does-not-exist",
    );
  });

  it("flags phases claimed by a milestone that do not exist", () => {
    const template = readRoadmap("fullstack-v1");
    const broken = {
      ...template,
      milestones: [
        ...template.milestones,
        {
          id: "m-ghost",
          title: "Ghost",
          phases: ["phase-ghost"],
          prerequisites: [],
        },
      ],
    };
    const errors = validateRoadmapTemplate(broken);
    expect(errors).toContain(
      "milestone m-ghost references unknown phase phase-ghost",
    );
  });

  it("flags prerequisite cycles", () => {
    const template = readRoadmap("fullstack-v1");
    const broken = {
      ...template,
      milestones: [
        ...template.milestones,
        {
          id: "m-a",
          title: "A",
          phases: [],
          prerequisites: ["m-b"],
        },
        {
          id: "m-b",
          title: "B",
          phases: [],
          prerequisites: ["m-a"],
        },
      ],
    };
    const errors = validateRoadmapTemplate(broken);
    expect(errors.some((error) => error.includes("cycle"))).toBe(true);
  });
});