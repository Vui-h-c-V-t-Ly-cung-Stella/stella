export type LensState = {
  imageDistanceCm: number | null;
  magnification: number | null;
  imageType: "real" | "virtual" | "at_infinity";
  orientation: "upright" | "inverted" | "undefined";
  relativeSize: "larger" | "same" | "smaller" | "undefined";
};

export function solveConvexLens(
  focalLengthCm: number,
  objectDistanceCm: number,
): LensState {
  const f = Math.max(0.1, focalLengthCm);
  const dO = Math.max(0.1, objectDistanceCm);
  const denominator = dO - f;

  if (Math.abs(denominator) < 0.05) {
    return {
      imageDistanceCm: null,
      magnification: null,
      imageType: "at_infinity",
      orientation: "undefined",
      relativeSize: "undefined",
    };
  }

  const dI = (f * dO) / denominator;
  const m = -dI / dO;
  const absM = Math.abs(m);

  return {
    imageDistanceCm: dI,
    magnification: m,
    imageType: dI > 0 ? "real" : "virtual",
    orientation: m < 0 ? "inverted" : "upright",
    relativeSize: absM > 1.05 ? "larger" : absM < 0.95 ? "smaller" : "same",
  };
}
