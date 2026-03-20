'use client';

import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  const router = useRouter();

  function createProject() {
    const projectId = 'dev-project-' + Date.now();
    router.push(`/studio-projects/${projectId}/builder`);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Projects</h1>
      <button
        onClick={createProject}
        className="px-4 py-2 rounded bg-black text-white"
      >
        Create New Project
      </button>
    </div>
  );
}
