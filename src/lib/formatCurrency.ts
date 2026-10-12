// Catalog prices are gross EUR amounts; do not infer currency from UI language.
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
