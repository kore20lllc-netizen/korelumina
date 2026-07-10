import {
  AppearanceSlider,
} from "../AppearanceSlider";

export function SliderSection() {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
      <h3 className="mb-5 font-semibold">
        Fine Tuning
      </h3>

      <div className="space-y-5">
        <AppearanceSlider
          label="Transparency"
          value={55}
        />

        <AppearanceSlider
          label="Blur"
          value={70}
        />

        <AppearanceSlider
          label="Tint Strength"
          value={65}
        />
      </div>
    </section>
  );
}
