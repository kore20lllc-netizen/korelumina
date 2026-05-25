import { createContext } from 'react';

export const ProjectContext = createContext<{
  projectId: string | null;
}>({
  projectId: null,
});
