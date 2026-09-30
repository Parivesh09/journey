/**
 * Simple validation that checks basic structure without full JSON Schema validation.
 * For production, this should be replaced with AJV validation against the Archify schemas.
 */

import type { DiagramType } from "@/lib/types/archify";

export function validateArchifyJSON(data: unknown, diagramType: DiagramType): string | null {
  if (!data || typeof data !== "object") {
    return "Invalid diagram: not an object";
  }

  const obj = data as Record<string, unknown>;

  // Check required fields for all diagram types
  if (obj.schema_version !== 1 && obj.schema_version !== 2) {
    return "Invalid schema_version: must be 1 or 2";
  }

  if (obj.diagram_type !== diagramType) {
    return `Invalid diagram_type: expected ${diagramType}, got ${obj.diagram_type}`;
  }

  if (!obj.meta || typeof obj.meta !== "object") {
    return "Missing meta object";
  }

  const meta = obj.meta as Record<string, unknown>;

  if (!meta.title || typeof meta.title !== "string") {
    return "Missing meta.title";
  }

  if (!meta.output || typeof meta.output !== "string") {
    return "Missing meta.output";
  }

  // Diagram-specific validation
  switch (diagramType) {
    case "architecture":
      return validateArchitecture(obj);
    case "workflow":
      return validateWorkflow(obj);
    case "sequence":
      return validateSequence(obj);
    case "dataflow":
      return validateDataflow(obj);
    case "lifecycle":
      return validateLifecycle(obj);
    default:
      return `Unknown diagram type: ${diagramType}`;
  }
}

function validateArchitecture(obj: Record<string, unknown>): string | null {
  if (!Array.isArray(obj.components) || obj.components.length === 0) {
    return "Architecture diagram must have at least one component";
  }

  for (const comp of obj.components as unknown[]) {
    const component = comp as Record<string, unknown>;
    if (!component.id || typeof component.id !== "string") {
      return "Component missing id";
    }
    if (!component.type || !["frontend", "backend", "database", "cloud", "security", "messagebus", "external"].includes(component.type as string)) {
      return `Invalid component type: ${component.type}`;
    }
    if (!component.label || typeof component.label !== "string") {
      return "Component missing label";
    }
  }

if (obj.connections && Array.isArray(obj.connections)) {
     const ids = new Set((obj.components as unknown[]).map((c) => (c as Record<string, unknown>).id));
     for (const conn of obj.connections as unknown[]) {
       const connection = conn as Record<string, unknown>;
       if (!ids.has(connection.from)) {
         return `Connection references unknown component: ${connection.from}`;
       }
       if (!ids.has(connection.to)) {
         return `Connection references unknown component: ${connection.to}`;
       }
     }
   }

  return null;
}

function validateWorkflow(obj: Record<string, unknown>): string | null {
   if (!Array.isArray(obj.lanes) || obj.lanes.length === 0) {
     return "Workflow diagram must have at least one lane";
   }

   if (!Array.isArray(obj.nodes) || obj.nodes.length === 0) {
     return "Workflow diagram must have at least one node";
   }

   const laneIds = new Set((obj.lanes as unknown[]).map((l) => (l as Record<string, unknown>).id));
   for (const node of obj.nodes as unknown[]) {
     const n = node as Record<string, unknown>;
     if (!laneIds.has(n.lane)) {
       return `Node references unknown lane: ${n.lane}`;
     }
   }

   if (obj.edges && Array.isArray(obj.edges)) {
     const nodeIds = new Set((obj.nodes as unknown[]).map((n) => (n as Record<string, unknown>).id));
     for (const edge of obj.edges as unknown[]) {
       const e = edge as Record<string, unknown>;
       if (!nodeIds.has(e.from)) {
         return `Edge references unknown node: ${e.from}`;
       }
       if (!nodeIds.has(e.to)) {
         return `Edge references unknown node: ${e.to}`;
       }
     }
   }

   return null;
 }

function validateSequence(obj: Record<string, unknown>): string | null {
   if (!Array.isArray(obj.participants) || obj.participants.length === 0) {
     return "Sequence diagram must have at least one participant";
   }

   if (!Array.isArray(obj.messages) || obj.messages.length === 0) {
     return "Sequence diagram must have at least one message";
   }

   const participantIds = new Set((obj.participants as unknown[]).map((p) => (p as Record<string, unknown>).id));
   for (const msg of obj.messages as unknown[]) {
     const m = msg as Record<string, unknown>;
     if (!participantIds.has(m.from)) {
       return `Message references unknown participant: ${m.from}`;
     }
     if (!participantIds.has(m.to)) {
       return `Message references unknown participant: ${m.to}`;
     }
   }

   return null;
 }

function validateDataflow(obj: Record<string, unknown>): string | null {
   if (!Array.isArray(obj.nodes) || obj.nodes.length === 0) {
     return "Dataflow diagram must have at least one node";
   }

   if (obj.edges && Array.isArray(obj.edges)) {
     const nodeIds = new Set((obj.nodes as unknown[]).map((n) => (n as Record<string, unknown>).id));
     for (const edge of obj.edges as unknown[]) {
       const e = edge as Record<string, unknown>;
       if (!nodeIds.has(e.from)) {
         return `Edge references unknown node: ${e.from}`;
       }
       if (!nodeIds.has(e.to)) {
         return `Edge references unknown node: ${e.to}`;
       }
     }
   }

   return null;
 }

function validateLifecycle(obj: Record<string, unknown>): string | null {
   if (!Array.isArray(obj.states) || obj.states.length === 0) {
     return "Lifecycle diagram must have at least one state";
   }

   const validStateTypes = ["initial", "terminal", "active", "waiting", "error", "transient"];
   for (const state of obj.states as unknown[]) {
     const s = state as Record<string, unknown>;
     if (!validStateTypes.includes(s.type as string)) {
       return `Invalid state type: ${s.type}`;
     }
   }

   if (obj.transitions && Array.isArray(obj.transitions)) {
     const stateIds = new Set((obj.states as unknown[]).map((s) => (s as Record<string, unknown>).id));
     for (const trans of obj.transitions as unknown[]) {
       const t = trans as Record<string, unknown>;
       if (!stateIds.has(t.from)) {
         return `Transition references unknown state: ${t.from}`;
       }
       if (!stateIds.has(t.to)) {
         return `Transition references unknown state: ${t.to}`;
       }
     }
   }

   return null;
 }

export function validateAndExtract<T>(data: unknown, diagramType: DiagramType): T {
  const error = validateArchifyJSON(data, diagramType);
  if (error) {
    throw new Error(`Invalid Archify ${diagramType} diagram: ${error}`);
  }
  return data as T;
}