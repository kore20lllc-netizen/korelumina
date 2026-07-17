import {
  LUMINA_MATERIALS,
} from "../registry";

import type {
  LuminaMaterialDefinition,
} from "../registry/materials";

import type {
  LuminaMaterialMode,
} from "../types";

export function resolveMaterial(
  material: LuminaMaterialMode,
): LuminaMaterialDefinition {
  return LUMINA_MATERIALS[
    material
  ];
}
