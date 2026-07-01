import path from "node:path";

import {
  getRepoRoot,
} from "./RepositoryPaths.js";

const KNOWLEDGE_ROOT = path.join(
  getRepoRoot(),
  "runtime",
  "knowledge",
);

function dir(name: string) {
  return path.join(KNOWLEDGE_ROOT, name);
}

export function getKnowledgeRoot() {
  return KNOWLEDGE_ROOT;
}

export function getArchitectureKnowledgeRoot() {
  return dir("architecture");
}

export function getSpecificationKnowledgeRoot() {
  return dir("specifications");
}

export function getAdrKnowledgeRoot() {
  return dir("adr");
}

export function getRepositoryKnowledgeRoot() {
  return dir("repository");
}

export function getEngineeringKnowledgeRoot() {
  return dir("engineering");
}

export function getRuntimeKnowledgeRoot() {
  return dir("runtime");
}

export function getProjectKnowledgeRoot() {
  return dir("projects");
}

export function getTaskKnowledgeRoot() {
  return dir("tasks");
}

export function getCommitKnowledgeRoot() {
  return dir("commits");
}

export function getDeploymentKnowledgeRoot() {
  return dir("deployments");
}

export function getTelemetryKnowledgeRoot() {
  return dir("telemetry");
}

export function getConversationKnowledgeRoot() {
  return dir("conversations");
}

export function getEmbeddingKnowledgeRoot() {
  return dir("embeddings");
}

export function getKnowledgeGraphRoot() {
  return dir("graph");
}

export function getKnowledgeSearchRoot() {
  return dir("search");
}

export function getKnowledgeCacheRoot() {
  return dir("cache");
}

export function getDecisionKnowledgeRoot() {
  return dir("decisions");
}
