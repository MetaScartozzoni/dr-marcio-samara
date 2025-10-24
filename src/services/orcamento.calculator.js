// src/services/orcamento.calculator.js
/**
 * Pure calculation function for orcamento values
 * @param {Array} items - Array of items with quantidade and valor_unitario
 * @param {Object} discountSettings - Discount configuration
 * @param {number} discountSettings.percentual - Discount percentage (0-100)
 * @param {number} discountSettings.valor_fixo - Fixed discount amount
 * @returns {Object} Calculated values: subtotal, discount_value, total_final
 */
function calculateOrcamento(items = [], discountSettings = {}) {
  // Validate inputs
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  // Calculate subtotal
  const subtotal = items.reduce((total, item) => {
    if (!item || typeof item.quantidade !== 'number' || typeof item.valor_unitario !== 'number') {
      throw new Error('Each item must have quantidade and valor_unitario as numbers');
    }
    if (item.quantidade < 0 || item.valor_unitario < 0) {
      throw new Error('Quantidade and valor_unitario must be non-negative');
    }
    return total + (item.quantidade * item.valor_unitario);
  }, 0);

  // Calculate discount
  let discount_value = 0;
  const { percentual = 0, valor_fixo = 0 } = discountSettings;

  if (percentual && percentual > 0) {
    if (percentual < 0 || percentual > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }
    discount_value = (subtotal * percentual) / 100;
  } else if (valor_fixo && valor_fixo > 0) {
    if (valor_fixo < 0) {
      throw new Error('Fixed discount must be non-negative');
    }
    discount_value = Math.min(valor_fixo, subtotal); // Discount can't exceed subtotal
  }

  // Calculate final total
  const total_final = Math.max(0, subtotal - discount_value);

  // Round to 2 decimal places
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_value: Math.round(discount_value * 100) / 100,
    total_final: Math.round(total_final * 100) / 100
  };
}

module.exports = {
  calculateOrcamento
};
