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
      <LuminaInspectorHeader>
        <LuminaInspectorTitle>
          {model.title}
        </LuminaInspectorTitle>

        {model.description && (
          <LuminaInspectorDescription>
            {model.description}
          </LuminaInspectorDescription>
        )}
      </LuminaInspectorHeader>

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
              />
            ))}
          </LuminaInspectorGroup>
        ))}
      </LuminaInspectorBody>
    </LuminaInspector>
  );
}
