"use strict";

import { describe, it, expect } from "vitest";
import { validateArchifyJSON, validateAndExtract } from "@/lib/visualization/validation";

describe("Archify Validation", () => {
  const validArchitectureDiagram = {
    schema_version: 1,
    diagram_type: "architecture",
    meta: { title: "Test", output: "test.html" },
    components: [
      {
        id: "frontend",
        type: "frontend",
        label: "Frontend",
      },
      {
        id: "backend",
        type: "backend",
        label: "Backend",
      },
      {
        id: "database",
        type: "database",
        label: "Database",
      },
    ],
    boundaries: [
      {
        kind: "region",
        label: "Application Tier",
        wraps: ["frontend", "backend"],
      },
    ],
    connections: [
      {
        id: "frontend-to-backend",
        from: "frontend",
        to: "backend",
        label: "API Calls",
        variant: "emphasis",
      },
    ],
    cards: [
      {
        dot: "cyan",
        title: "Frontend",
        items: ["React", "TypeScript"],
      },
    ],
  };

  const invalidWorkflowDiagram = {
    schema_version: 2,
    diagram_type: "workflow",
    meta: { title: "Test", output: "test.html" },
    lanes: [
      { id: "lane1", label: "Lane 1" },
    ],
    nodes: [
      {
        id: "node1",
        lane: "lane1",
        col: 0,
        type: "frontend",
        label: "Node 1",
      },
    ],
    edges: [
      {
        id: "edge1",
        from: "node1",
        to: "node2", // Invalid - to node doesn't exist
        label: "Flow",
        variant: "emphasis",
        role: "main",
      },
    ],
  };

  describe("validateArchifyJSON", () => {
    it("should validate a correct architecture diagram", () => {
      const error = validateArchifyJSON(validArchitectureDiagram, "architecture");
      expect(error).toBeNull();
    });

    it("should reject an architecture diagram with invalid component type", () => {
      const invalid = {
        ...validArchitectureDiagram,
        components: [
          {
            id: "invalid",
            type: "invalid-type", // Invalid type
            label: "Invalid",
          },
        ],
      };

      const error = validateArchifyJSON(invalid, "architecture");
      expect(error).not.toBeNull();
    });

    it("should reject an invalid diagram type", () => {
      const error = validateArchifyJSON(validArchitectureDiagram, "invalid" as any);
      expect(error).not.toBeNull();
    });

    it("should reject a workflow diagram with invalid nodes/edges", () => {
      const error = validateArchifyJSON(invalidWorkflowDiagram, "workflow");
      expect(error).not.toBeNull();
    });
  });

  describe("validateAndExtract", () => {
    it("should return typed data for valid diagram", () => {
      const result = validateAndExtract(validArchitectureDiagram, "architecture");
      expect(result).toEqual(validArchitectureDiagram);
    });

    it("should throw for invalid diagram", () => {
      expect(() => {
        validateAndExtract({} as any, "architecture");
      }).toThrow("Invalid Archify architecture diagram");
    });
  });
});