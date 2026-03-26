export function formatEGP(amount: number): string {
  return `${amount.toFixed(2)} EGP`;
}

export function formatKWh(kwh: number): string {
  return `${kwh.toFixed(1)} kWh`;
}

export function formatPricePerKWh(price: number): string {
  return `${price.toFixed(3)} EGP/kWh`;
}
