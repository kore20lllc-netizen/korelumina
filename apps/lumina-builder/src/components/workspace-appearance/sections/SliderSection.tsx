import {
  AppearanceSlider,
} from "../AppearanceSlider";
import {
  useWorkspaceAppearance,
} from "../context/WorkspaceAppearanceContext";

/* MS-2026-0006: the sliders showed fixed values and could not move. */
export function SliderSection() {
  const { state, actions } = useWorkspaceAppearance();

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
      <h3 className="mb-5 font-semibold">
        Fine Tuning
      </h3>

      <div className="space-y-5">
        <AppearanceSlider
          label="Transparency"
          value={state.transparency}
          onChange={actions.setTransparency}
        />

        <AppearanceSlider
          label="Blur"
          value={state.blur}
          onChange={actions.setBlur}
        />

        <AppearanceSlider
          label="Tint Strength"
          value={state.tintStrength}
          onChange={actions.setTintStrength}
        />
      </div>
    </section>
  );
}
