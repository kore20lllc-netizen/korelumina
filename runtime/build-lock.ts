let activeBuilds = 0;
const MAX_CONCURRENT_BUILDS = 2;

export function canStartBuild() {
  return activeBuilds < MAX_CONCURRENT_BUILDS;
}

export function startBuild() {
  activeBuilds++;
}

export function endBuild() {
  if (activeBuilds > 0) activeBuilds--;
}
