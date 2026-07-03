import {
  KnowledgePlatform,
} from "../KnowledgePlatform.js";

export class RuntimeKnowledgeProvider {
  private readonly platform =
    new KnowledgePlatform();

  getPlatform(): KnowledgePlatform {
    return this.platform;
  }
}

export const runtimeKnowledgeProvider =
  new RuntimeKnowledgeProvider();
