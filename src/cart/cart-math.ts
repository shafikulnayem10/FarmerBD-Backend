export const SAME_DISTRICT_FEE = 60;
export const OTHER_DISTRICT_FEE = 120;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundQuantity(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function calculateDeliveryFee(
  farmerDistrict: string | null,
  addressDistrict: string,
): number {
  if (farmerDistrict === addressDistrict) {
    return SAME_DISTRICT_FEE;
  }
  return OTHER_DISTRICT_FEE;
}