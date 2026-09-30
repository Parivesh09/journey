"use strict";

import { describe, it, expect } from "vitest";
import { buildVisualizationContext, buildCompactContext, computeSourceHash } from "@/lib/visualization/context-builder";

describe("Visualization Context Builder", () => {
  describe("buildVisualizationContext", () => {
    it("should build a visualization context with limits applied", () => {
      const context = buildVisualizationContext("fullstack-v1", {
        maxSections: 2,
        maxTopicsPerSection: 1,
        maxTasksPerTopic: 2,
        includeDescriptions: false,
      });

      expect(context.roadmap.id).toBe("fullstack-v1");
      expect(context.roadmap.title).toBe("Full Stack Web Development");
      expect(context.roadmap.description).toBe("A guided path from HTML, CSS and JavaScript up to a deployed full-stack application with React, Node.js and PostgreSQL.");

      // Should have 2 sections (maxSections)
      expect(context.sections.length).toBe(2);
      expect(context.sections[0].id).toBe("phase-html");
      expect(context.sections[0].title).toBe("HTML Foundations");

      // Each section should have 1 topic (maxTopicsPerSection)
      expect(context.sections[0].topics.length).toBe(1);
      expect(context.sections[0].topics[0].id).toBe("html-semantics");
      expect(context.sections[0].topics[0].title).toBe("Semantic markup");

      // Each topic should have 2 tasks (maxTasksPerTopic)
      expect(context.sections[0].topics[0].tasks.length).toBe(2);
      expect(context.sections[0].topics[0].tasks[0].id).toBe("hs-01");
      expect(context.sections[0].topics[0].tasks[0].title).toBe("Structure a page with only semantic elements (header, nav, main, section, article, footer)");
      expect(context.sections[0].topics[0].tasks[1].id).toBe("hs-02");
      expect(context.sections[0].topics[0].tasks[1].title).toBe("Explain the document outline created by heading hierarchy");

      // Descriptions should be undefined when includeDescriptions is false
      expect(context.sections[0].description).toBeUndefined();
      expect(context.sections[0].topics[0].description).toBeUndefined();
      expect(context.sections[0].topics[0].tasks[0].description).toBeUndefined();

      // Metadata should be correct
      expect(context.metadata.totalSections).toBe(2);
      expect(context.metadata.totalTopics).toBe(2); // 1 topic per section
      expect(context.metadata.totalTasks).toBe(4); // 2 tasks per topic
    });

    it("should include descriptions when requested", () => {
      const context = buildVisualizationContext("fullstack-v1", {
        maxSections: 1,
        maxTopicsPerSection: 1,
        maxTasksPerTopic: 1,
        includeDescriptions: true,
      });

      // Phase has category "HTML"
      expect(context.sections[0].description).toBe("HTML");
      // Topic has category "HTML"
      expect(context.sections[0].topics[0].description).toBe("HTML");
      // Task doesn't have description, but has type "practice"
      expect(context.sections[0].topics[0].tasks[0].description).toBe("practice");
    });
  });

  describe("buildCompactContext", () => {
    it("should build a compact context without limits", () => {
      const context = buildCompactContext("fullstack-v1");

      expect(context.roadmap.id).toBe("fullstack-v1");
      expect(context.sections.length).toBeGreaterThan(0); // Has sections
      expect(context.sections[0].topics.length).toBeGreaterThan(0); // Has topics
      expect(context.sections[0].topics[0].tasks.length).toBeGreaterThan(0); // Has tasks

      // Descriptions should be undefined in compact context
      expect(context.sections[0].description).toBeUndefined();
      expect(context.sections[0].topics[0].description).toBeUndefined();
      expect(context.sections[0].topics[0].tasks[0].description).toBeUndefined();

      // Metadata should count all items
      expect(context.metadata.totalSections).toBe(14); // 14 phases in fullstack-v1
      expect(context.metadata.totalTopics).toBeGreaterThan(0); // Has topics
      expect(context.metadata.totalTasks).toBeGreaterThan(0); // Has tasks
    });
  });

  describe("computeSourceHash", () => {
    it("should generate consistent hashes for identical inputs", () => {
      const context = buildVisualizationContext("fullstack-v1");
      const input1: any = {
        roadmapId: "fullstack-v1",
        diagramType: "architecture",
        context,
        config: {
          promptVersion: "1",
          generationVersion: "1",
        },
      };
      const input2: any = {
        roadmapId: "fullstack-v1",
        diagramType: "architecture",
        context,
        config: {
          promptVersion: "1",
          generationVersion: "1",
        },
      };

      const hash1 = computeSourceHash(input1);
      const hash2 = computeSourceHash(input2);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^v[0-9a-f]{8}$/);
    });

    it("should generate different hashes for different inputs", () => {
      const context = buildVisualizationContext("fullstack-v1");
      const input1: any = {
        roadmapId: "fullstack-v1",
        diagramType: "architecture",
        context,
        config: {
          promptVersion: "1",
          generationVersion: "1",
        },
      };
      const input2: any = {
        roadmapId: "fullstack-v1",
        diagramType: "workflow", // Different diagram type
        context,
        config: {
          promptVersion: "1",
          generationVersion: "1",
        },
      };

      const hash1 = computeSourceHash(input1);
      const hash2 = computeSourceHash(input2);

      expect(hash1).not.toBe(hash2);
    });
  });
});