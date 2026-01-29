/**
 * Tax Configuration
 * Centralized tax rate settings for the application
 */

export const TAX_CONFIG = {
  // GST rate as a decimal (0.18 = 18%)
  GST_RATE: 0.18,
  
  // Display name for tax
  TAX_NAME: 'GST',
  
  // Whether to apply tax
  APPLY_TAX: true,
};

/**
 * Calculate tax amount from subtotal
 * @param subtotal - The subtotal amount before tax
 * @returns Tax amount rounded to nearest rupee
 */
export const calculateTax = (subtotal: number): number => {
  if (!TAX_CONFIG.APPLY_TAX) return 0;
  return Math.round(subtotal * TAX_CONFIG.GST_RATE);
};

/**
 * Calculate total amount including tax
 * @param subtotal - The subtotal amount before tax
 * @returns Total amount including tax
 */
export const calculateTotal = (subtotal: number): number => {
  const tax = calculateTax(subtotal);
  return subtotal + tax;
};

/**
 * Get tax percentage for display
 * @returns Tax percentage as a string (e.g., "18%")
 */
export const getTaxPercentage = (): string => {
  return `${Math.round(TAX_CONFIG.GST_RATE * 100)}%`;
};
