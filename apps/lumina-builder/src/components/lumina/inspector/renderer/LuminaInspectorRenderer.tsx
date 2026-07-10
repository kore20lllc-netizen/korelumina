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
              >
                {section.controls.map((control) => (
                  <div
                    key={control.id}
                    className="rounded-xl border border-white/10 px-3 py-2"
                  >
                    <div className="text-sm font-medium">
                      {control.label}
                    </div>

                    {control.description && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {control.description}
                      </div>
                    )}
                  </div>
                ))}
              </LuminaInspectorSection>
            ))}
          </LuminaInspectorGroup>
        ))}
      </LuminaInspectorBody>
    </LuminaInspector>
  );
}
