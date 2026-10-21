import { LuminaSurface } from "@/components/lumina/surface/LuminaSurface";

import {
  LuminaInspector,
  LuminaInspectorBody,
  LuminaInspectorDescription,
  LuminaInspectorGroup,
  LuminaInspectorHeader,
  LuminaInspectorSection,
  LuminaInspectorTitle,
} from "../";

import type {
  LuminaInspectorModel,
} from "../model";

export interface LuminaInspectorRendererProps {
  model: LuminaInspectorModel;
}

export function LuminaInspectorRenderer({
  model,
}: LuminaInspectorRendererProps) {
  return (
    <LuminaInspector>
      {/* The header renders its title prop and ignored the children it was given. */}
      <LuminaInspectorHeader
        title={
          <>
            <LuminaInspectorTitle>
              {model.title}
            </LuminaInspectorTitle>

            {model.description && (
              <LuminaInspectorDescription>
                {model.description}
              </LuminaInspectorDescription>
            )}
          </>
        }
      />

      <LuminaInspectorBody>
        {model.groups.map((group) => (
          <LuminaInspectorGroup
            key={group.id}
            title={group.title}
          >
            {group.sections.map((section) => (
              <LuminaInspectorSection
                key={section.id}
                title={section.title}
              >
                {section.controls.map((control) => (
                  <LuminaSurface
                    key={control.id}
                    variant="compact"
                    className="px-3 py-2"
                  >
                    <div className="text-sm font-medium">
                      {control.label}
                    </div>

                    {control.description && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {control.description}
                      </div>
                    )}
                  </LuminaSurface>
                ))}
              </LuminaInspectorSection>
            ))}
          </LuminaInspectorGroup>
        ))}
      </LuminaInspectorBody>
    </LuminaInspector>
  );
}

export default LuminaInspectorRenderer;
