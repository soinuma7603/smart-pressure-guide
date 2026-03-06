export function psiToBar(psi: number): number {
  return Math.round((psi / 14.5038) * 10) / 10;
}

export type TireType = "clincher" | "tubeless";
export type Surface = "smooth" | "normal" | "rough" | "gravel";
export type RideStyle = "race" | "normal" | "comfort";
export type Manufacturer =
  | "continental"
  | "panaracer"
  | "vittoria"
  | "schwalbe"
  | "michelin"
  | "pirelli"
  | "irc"
  | "bridgestone"
  | "other";

export type PressureInput = {
  riderWeight: number;
  bikeWeight: number;
  tireWidth: number;
  tireType: TireType;
  surface: Surface;
  rimWidth?: number;
  manufacturer?: Manufacturer;
  rideStyle?: RideStyle;
};

export type PressureResult = {
  frontPsi: number;
  rearPsi: number;
  frontBar: number;
  rearBar: number;
};

const SURFACE_CORRECTION: Record<Surface, number> = {
  smooth:  0,
  normal: -3,
  rough:  -6,
  gravel: -10,
};

const TIRE_TYPE_CORRECTION: Record<TireType, number> = {
  clincher:  0,
  tubeless: -5,
};

const RIDE_STYLE_CORRECTION: Record<RideStyle, number> = {
  race:    3,
  normal:  0,
  comfort: -4,
};


export function calculatePressure(input: PressureInput): PressureResult {
  const {
    riderWeight,
    bikeWeight,
    tireWidth,
    tireType,
    surface,
    rimWidth = 19,
    rideStyle = "normal",
  } = input;

  const totalWeight       = riderWeight + bikeWeight;
  const K                 = 458;
  const effectiveTireWidth = tireWidth + (rimWidth - 17) * 0.4;
  const rearLoad          = totalWeight * 0.509;
  const frontLoad         = totalWeight * 0.491;

  let frontPsi = K * frontLoad / Math.pow(effectiveTireWidth, 1.6);
  let rearPsi  = K * rearLoad  / Math.pow(effectiveTireWidth, 1.6);

  const adj =
    SURFACE_CORRECTION[surface] +
    TIRE_TYPE_CORRECTION[tireType] +
    RIDE_STYLE_CORRECTION[rideStyle];

  frontPsi += adj;
  rearPsi  += adj;

  frontPsi = Math.max(28, Math.min(130, Math.round(frontPsi)));
  rearPsi  = Math.max(32, Math.min(140, Math.round(rearPsi)));

  return {
    frontPsi,
    rearPsi,
    frontBar: psiToBar(frontPsi),
    rearBar:  psiToBar(rearPsi),
  };
}

export const MANUFACTURER_LABELS: Record<Manufacturer, string> = {
  continental: "Continental（コンチネンタル）",
  panaracer:   "Panaracer（パナレーサー）",
  vittoria:    "Vittoria（ヴィットリア）",
  schwalbe:    "Schwalbe（シュワルベ）",
  michelin:    "Michelin（ミシュラン）",
  pirelli:     "Pirelli（ピレリ）",
  irc:         "IRC（アイアールシー）",
  bridgestone: "Bridgestone（ブリヂストン）",
  other:       "その他",
};
