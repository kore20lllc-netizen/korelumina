import {
  InMemoryExecutiveExperienceGraph,
} from "./ExecutiveExperienceGraph.js";
import {
  InMemoryExecutiveMemoryIndex,
} from "./ExecutiveMemoryIndex.js";
import {
  ExecutiveMemoryService,
} from "./ExecutiveMemoryService.js";
import {
  InMemoryExecutiveMemoryStore,
} from "./ExecutiveMemoryStore.js";

export function createExecutiveMemoryService():
  ExecutiveMemoryService {
  return new ExecutiveMemoryService({
    store:
      new InMemoryExecutiveMemoryStore(),

    index:
      new InMemoryExecutiveMemoryIndex(),

    experienceGraph:
      new InMemoryExecutiveExperienceGraph(),
  });
}
