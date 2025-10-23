// tests/orcamento.service.test.js
// Unit tests for orcamento calculation logic

const orcamentoService = require('../src/services/orcamento.service');

describe('OrcamentoService - calcularOrcamento', () => {
  
  describe('Valid calculations', () => {
    
    test('should calculate simple subtotal without discount', () => {
      const itens = [
        { descricao: 'Item 1', qtd: 2, valor_unitario: 100 },
        { descricao: 'Item 2', qtd: 1, valor_unitario: 50 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, {});
      
      expect(result.subtotal).toBe(250);
      expect(result.desconto_valor).toBe(0);
      expect(result.valor_final).toBe(250);
    });

    test('should calculate with percentage discount', () => {
      const itens = [
        { descricao: 'Item 1', qtd: 2, valor_unitario: 100 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, { percentual: 10 });
      
      expect(result.subtotal).toBe(200);
      expect(result.desconto_valor).toBe(20);
      expect(result.valor_final).toBe(180);
    });

    test('should calculate with fixed discount value', () => {
      const itens = [
        { descricao: 'Item 1', qtd: 1, valor_unitario: 100 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, { desconto_valor: 15 });
      
      expect(result.subtotal).toBe(100);
      expect(result.desconto_valor).toBe(15);
      expect(result.valor_final).toBe(85);
    });

    test('should handle multiple items with varying quantities', () => {
      const itens = [
        { descricao: 'Consulta', qtd: 1, valor_unitario: 150 },
        { descricao: 'Exame 1', qtd: 2, valor_unitario: 80 },
        { descricao: 'Exame 2', qtd: 3, valor_unitario: 60 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, { percentual: 5 });
      
      expect(result.subtotal).toBe(490); // 150 + 160 + 180
      expect(result.desconto_valor).toBe(24.5); // 5% of 490
      expect(result.valor_final).toBe(465.5);
    });

    test('should handle zero discount', () => {
      const itens = [
        { descricao: 'Item', qtd: 1, valor_unitario: 100 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, { percentual: 0 });
      
      expect(result.subtotal).toBe(100);
      expect(result.desconto_valor).toBe(0);
      expect(result.valor_final).toBe(100);
    });

    test('should handle 100% discount', () => {
      const itens = [
        { descricao: 'Item', qtd: 1, valor_unitario: 100 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, { percentual: 100 });
      
      expect(result.subtotal).toBe(100);
      expect(result.desconto_valor).toBe(100);
      expect(result.valor_final).toBe(0);
    });

    test('should accept "quantidade" as alternative to "qtd"', () => {
      const itens = [
        { descricao: 'Item', quantidade: 2, valor_unitario: 50 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, {});
      
      expect(result.subtotal).toBe(100);
    });

    test('should round to 2 decimal places', () => {
      const itens = [
        { descricao: 'Item', qtd: 3, valor_unitario: 33.33 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, { percentual: 10 });
      
      expect(result.subtotal).toBe(99.99);
      expect(result.desconto_valor).toBe(10);
      expect(result.valor_final).toBe(89.99);
    });

  });

  describe('Validation - Invalid items', () => {
    
    test('should throw error for empty items array', () => {
      expect(() => {
        orcamentoService.calcularOrcamento([], {});
      }).toThrow('Pelo menos um item deve ser incluído no orçamento');
    });

    test('should throw error for null items', () => {
      expect(() => {
        orcamentoService.calcularOrcamento(null, {});
      }).toThrow('Pelo menos um item deve ser incluído no orçamento');
    });

    test('should throw error for missing descricao', () => {
      const itens = [
        { qtd: 1, valor_unitario: 100 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, {});
      }).toThrow('Todos os itens devem ter descrição válida');
    });

    test('should throw error for empty descricao', () => {
      const itens = [
        { descricao: '   ', qtd: 1, valor_unitario: 100 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, {});
      }).toThrow('Todos os itens devem ter descrição válida');
    });

    test('should throw error for quantity less than 1', () => {
      const itens = [
        { descricao: 'Item', qtd: 0, valor_unitario: 100 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, {});
      }).toThrow('Quantidade deve ser >= 1');
    });

    test('should throw error for negative quantity', () => {
      const itens = [
        { descricao: 'Item', qtd: -5, valor_unitario: 100 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, {});
      }).toThrow('Quantidade deve ser >= 1');
    });

    test('should throw error for negative valor_unitario', () => {
      const itens = [
        { descricao: 'Item', qtd: 1, valor_unitario: -50 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, {});
      }).toThrow('Valor unitário deve ser >= 0');
    });

    test('should allow zero valor_unitario', () => {
      const itens = [
        { descricao: 'Free Item', qtd: 1, valor_unitario: 0 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, {});
      
      expect(result.subtotal).toBe(0);
      expect(result.valor_final).toBe(0);
    });

  });

  describe('Validation - Invalid discounts', () => {
    
    test('should throw error for percentual < 0', () => {
      const itens = [
        { descricao: 'Item', qtd: 1, valor_unitario: 100 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, { percentual: -10 });
      }).toThrow('Desconto percentual deve estar entre 0 e 100');
    });

    test('should throw error for percentual > 100', () => {
      const itens = [
        { descricao: 'Item', qtd: 1, valor_unitario: 100 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, { percentual: 150 });
      }).toThrow('Desconto percentual deve estar entre 0 e 100');
    });

    test('should throw error for negative desconto_valor', () => {
      const itens = [
        { descricao: 'Item', qtd: 1, valor_unitario: 100 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, { desconto_valor: -20 });
      }).toThrow('Desconto em valor deve ser >= 0');
    });

    test('should throw error for desconto_valor > subtotal', () => {
      const itens = [
        { descricao: 'Item', qtd: 1, valor_unitario: 100 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, { desconto_valor: 150 });
      }).toThrow('Desconto não pode ser maior que o subtotal');
    });

    test('should throw error for inconsistent percentual and desconto_valor', () => {
      const itens = [
        { descricao: 'Item', qtd: 1, valor_unitario: 100 }
      ];
      
      expect(() => {
        orcamentoService.calcularOrcamento(itens, { 
          percentual: 10,  // should be 10
          desconto_valor: 20  // but is 20
        });
      }).toThrow('Desconto percentual e valor são inconsistentes');
    });

    test('should accept consistent percentual and desconto_valor', () => {
      const itens = [
        { descricao: 'Item', qtd: 1, valor_unitario: 100 }
      ];
      
      const result = orcamentoService.calcularOrcamento(itens, { 
        percentual: 10,
        desconto_valor: 10
      });
      
      expect(result.desconto_valor).toBe(10);
      expect(result.valor_final).toBe(90);
    });

  });

});
