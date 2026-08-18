import type {
  KnowledgePackage,
} from "../data/knowledgePackages";

interface KnowledgeFragmentBranchesProps {
  knowledgePackage: KnowledgePackage;
}

export function KnowledgeFragmentBranches({
  knowledgePackage,
}: KnowledgeFragmentBranchesProps) {
  const removed =
    knowledgePackage.fragments.filter(
      (fragment) =>
        fragment.disposition === "discarded",
    );

  const splits =
    knowledgePackage.fragments.filter(
      (fragment) =>
        fragment.disposition === "split",
    );

  if (
    removed.length === 0 &&
    splits.length === 0
  ) {
    return null;
  }

  return (
    <div className="ml-[10%] flex flex-wrap items-center gap-2 pl-4">
      {removed.map((fragment) => (
        <div
          key={fragment.id}
          className="
            flex
            items-center
            gap-2
            rounded-full
            border
            border-rose-300/20
            bg-rose-400/[0.06]
            px-3
            py-1.5
            text-[10px]
            text-rose-200/70
            opacity-70
          "
        >
          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-rose-300/70
            "
          />

          <span className="line-through">
            {fragment.label}
          </span>

          <span>
            {fragment.proportion}%
          </span>
        </div>
      ))}

      {splits.map((fragment) => (
        <div
          key={fragment.id}
          className="
            flex
            items-center
            gap-2
            rounded-full
            border
            border-violet-300/25
            bg-violet-400/[0.08]
            px-3
            py-1.5
            text-[10px]
            text-violet-100
          "
        >
          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-violet-300
            "
          />

          <span>
            Split
          </span>

          <span className="text-violet-200/65">
            {fragment.childPackageId}
          </span>
        </div>
      ))}
    </div>
  );
}
