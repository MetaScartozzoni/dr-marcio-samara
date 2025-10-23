// tests/orcamento.calculator.test.js
const { calculateOrcamento } = require('../src/services/orcamento.calculator');

describe('Orcamento Calculator', () => {
  describe('Basic Calculations', () => {
    test('should calculate subtotal with single item', () => {
      const items = [
        { quantidade: 2, valor_unitario: 100 }
      ];
      
      const result = calculateOrcamento(items);
      
      expect(result.subtotal).toBe(200);
      expect(result.discount_value).toBe(0);
      expect(result.total_final).toBe(200);
    });

    test('should calculate subtotal with multiple items', () => {
      const items = [
        { quantidade: 2, valor_unitario: 100 },
        { quantidade: 1, valor_unitario: 50 },
        { quantidade: 3, valor_unitario: 25 }
      ];
      
      const result = calculateOrcamento(items);
      
      expect(result.subtotal).toBe(325);
      expect(result.discount_value).toBe(0);
      expect(result.total_final).toBe(325);
    });

    test('should handle empty items array', () => {
      const result = calculateOrcamento([]);
      
      expect(result.subtotal).toBe(0);
      expect(result.discount_value).toBe(0);
      expect(result.total_final).toBe(0);
    });
  });

  describe('Percentage Discount', () => {
    test('should apply percentage discount correctly', () => {
      const items = [
        { quantidade: 2, valor_unitario: 100 }
      ];
      
      const result = calculateOrcamento(items, { percentual: 10 });
      
      expect(result.subtotal).toBe(200);
      expect(result.discount_value).toBe(20);
      expect(result.total_final).toBe(180);
    });

    test('should handle 100% discount', () => {
      const items = [
        { quantidade: 1, valor_unitario: 100 }
      ];
      
      const result = calculateOrcamento(items, { percentual: 100 });
      
      expect(result.subtotal).toBe(100);
      expect(result.discount_value).toBe(100);
      expect(result.total_final).toBe(0);
    });

    test('should handle fractional discount percentages', () => {
      const items = [
        { quantidade: 1, valor_unitario: 100 }
      ];
      
      const result = calculateOrcamento(items, { percentual: 12.5 });
      
      expect(result.subtotal).toBe(100);
      expect(result.discount_value).toBe(12.5);
      expect(result.total_final).toBe(87.5);
    });
  });

  describe('Fixed Discount', () => {
    test('should apply fixed discount correctly', () => {
      const items = [
        { quantidade: 2, valor_unitario: 100 }
      ];
      
      const result = calculateOrcamento(items, { valor_fixo: 30 });
      
      expect(result.subtotal).toBe(200);
      expect(result.discount_value).toBe(30);
      expect(result.total_final).toBe(170);
    });

    test('should cap fixed discount at subtotal', () => {
      const items = [
        { quantidade: 1, valor_unitario: 100 }
      ];
      
      const result = calculateOrcamento(items, { valor_fixo: 150 });
      
      expect(result.subtotal).toBe(100);
      expect(result.discount_value).toBe(100);
      expect(result.total_final).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero quantity', () => {
      const items = [
        { quantidade: 0, valor_unitario: 100 }
      ];
      
      const result = calculateOrcamento(items);
      
      expect(result.subtotal).toBe(0);
      expect(result.total_final).toBe(0);
    });

    test('should handle zero price', () => {
      const items = [
        { quantidade: 5, valor_unitario: 0 }
      ];
      
      const result = calculateOrcamento(items);
      
      expect(result.subtotal).toBe(0);
      expect(result.total_final).toBe(0);
    });

    test('should round to 2 decimal places', () => {
      const items = [
        { quantidade: 3, valor_unitario: 10.333 }
      ];
      
      const result = calculateOrcamento(items);
      
      expect(result.subtotal).toBe(30.99); // Rounded
    });

    test('should handle fractional quantities', () => {
      const items = [
        { quantidade: 1.5, valor_unitario: 100 }
      ];
      
      const result = calculateOrcamento(items);
      
      expect(result.subtotal).toBe(150);
      expect(result.total_final).toBe(150);
    });
  });

  describe('Validation', () => {
    test('should throw error for non-array items', () => {
      expect(() => {
        calculateOrcamento('not an array');
      }).toThrow('Items must be an array');
    });

    test('should throw error for invalid item structure', () => {
      expect(() => {
        calculateOrcamento([{ invalid: 'item' }]);
      }).toThrow('Each item must have quantidade and valor_unitario as numbers');
    });

    test('should throw error for negative quantidade', () => {
      expect(() => {
        calculateOrcamento([{ quantidade: -1, valor_unitario: 100 }]);
      }).toThrow('Quantidade and valor_unitario must be non-negative');
    });

    test('should throw error for negative valor_unitario', () => {
      expect(() => {
        calculateOrcamento([{ quantidade: 1, valor_unitario: -100 }]);
      }).toThrow('Quantidade and valor_unitario must be non-negative');
    });

    test('should throw error for invalid percentage discount', () => {
      expect(() => {
        calculateOrcamento(
          [{ quantidade: 1, valor_unitario: 100 }],
          { percentual: 150 }
        );
      }).toThrow('Discount percentage must be between 0 and 100');
    });

    test('should throw error for negative percentage discount', () => {
      expect(() => {
        calculateOrcamento(
          [{ quantidade: 1, valor_unitario: 100 }],
          { percentual: -10 }
        );
      }).toThrow('Discount percentage must be between 0 and 100');
    });

    test('should throw error for negative fixed discount', () => {
      expect(() => {
        calculateOrcamento(
          [{ quantidade: 1, valor_unitario: 100 }],
          { valor_fixo: -50 }
        );
      }).toThrow('Fixed discount must be non-negative');
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle realistic medical procedure pricing', () => {
      const items = [
        { quantidade: 1, valor_unitario: 1500 }, // Consulta inicial
        { quantidade: 3, valor_unitario: 200 },  // Sessões de tratamento
        { quantidade: 1, valor_unitario: 850 }   // Exames complementares
      ];
      
      const result = calculateOrcamento(items, { percentual: 15 });
      
      expect(result.subtotal).toBe(2950);
      expect(result.discount_value).toBe(442.5);
      expect(result.total_final).toBe(2507.5);
    });

    test('should prefer percentage over fixed when both provided', () => {
      const items = [
        { quantidade: 1, valor_unitario: 1000 }
      ];
      
      const result = calculateOrcamento(items, {
        percentual: 10,
        valor_fixo: 200
      });
      
      // Should use percentage discount
      expect(result.discount_value).toBe(100);
      expect(result.total_final).toBe(900);
    });
  });
});
