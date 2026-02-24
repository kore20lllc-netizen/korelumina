export type AiMode = "draft" | "patch" | "execute";

export type AiFile = {
  path: string;
  content: string;
};

export type AiPatch = {
  path: string;
  diff: string;
};

export type AiExecute = {
  cwd?: string;
  commands: string[];
};

export type AiResponse = {
  mode: AiMode;
  summary: string;
  files?: AiFile[];
  patches?: AiPatch[];
  execute?: AiExecute;
};
