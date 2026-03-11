import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">KoreLumina</h1>
        <p className="text-gray-400 text-sm mt-2">Workspace</p>
      </div>
      
      <nav className="flex-1 px-4">
        <div className="space-y-2">
          <button
            className="w-full text-left block px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-not-allowed opacity-60"
            disabled
            title="Manage and switch between projects"
          >
            Projects
          </button>
          <Link
            href="/builder"
            className="block px-4 py-2 rounded-lg bg-gray-800 text-white font-medium"
            title="Describe what you want to build"
          >
            Builder
          </Link>
          <button
            className="w-full text-left block px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-not-allowed opacity-60"
            disabled
            title="Review generated files and structure"
          >
            Files
          </button>
          <button
            className="w-full text-left block px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-not-allowed opacity-60"
            disabled
            title="Connected databases and services"
          >
            Data
          </button>
          <button
            className="w-full text-left block px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-not-allowed opacity-60"
            disabled
            title="Track previews and production releases"
          >
            Deployments
          </button>
          <button
            className="w-full text-left block px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-not-allowed opacity-60"
            disabled
            title="Project configuration and preferences"
          >
            Settings
          </button>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">Version 0.1.0</p>
      </div>
    </aside>
  );
}
