export type BaseLuminaProps = {
  className?: string;
  disableAnimation?: boolean;
  opacity?: number;
};

export type LuminaCoreProps = BaseLuminaProps & {
  size?: number;
  scale?: number;
};

export type LuminaAmbientProps = BaseLuminaProps & {
  blur?: number;
  scale?: number;
};

export type LuminaMarkProps = {
  className?: string;
};
