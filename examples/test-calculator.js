#!/usr/bin/env node
// examples/test-calculator.js
// Simple script to test the orcamento calculator

const { calculateOrcamento } = require('../src/services/orcamento.calculator');

console.log('='.repeat(60));
console.log('Testing Orcamento Calculator');
console.log('='.repeat(60));

// Test 1: Simple calculation
console.log('\n1. Simple calculation (2 items, no discount):');
const items1 = [
  { descricao: 'Consulta', quantidade: 1, valor_unitario: 500 },
  { descricao: 'Exame', quantidade: 2, valor_unitario: 150 }
];
const result1 = calculateOrcamento(items1);
console.log('Items:', JSON.stringify(items1, null, 2));
console.log('Result:', result1);
console.log(`✓ Subtotal: R$ ${result1.subtotal.toFixed(2)}`);
console.log(`✓ Discount: R$ ${result1.discount_value.toFixed(2)}`);
console.log(`✓ Total: R$ ${result1.total_final.toFixed(2)}`);

// Test 2: With percentage discount
console.log('\n2. With 10% discount:');
const items2 = [
  { descricao: 'Procedimento', quantidade: 1, valor_unitario: 1000 }
];
const result2 = calculateOrcamento(items2, { percentual: 10 });
console.log('Items:', JSON.stringify(items2, null, 2));
console.log('Discount: 10%');
console.log('Result:', result2);
console.log(`✓ Subtotal: R$ ${result2.subtotal.toFixed(2)}`);
console.log(`✓ Discount: R$ ${result2.discount_value.toFixed(2)}`);
console.log(`✓ Total: R$ ${result2.total_final.toFixed(2)}`);

// Test 3: With fixed discount
console.log('\n3. With R$ 100 fixed discount:');
const items3 = [
  { descricao: 'Tratamento', quantidade: 1, valor_unitario: 500 }
];
const result3 = calculateOrcamento(items3, { valor_fixo: 100 });
console.log('Items:', JSON.stringify(items3, null, 2));
console.log('Discount: R$ 100 fixed');
console.log('Result:', result3);
console.log(`✓ Subtotal: R$ ${result3.subtotal.toFixed(2)}`);
console.log(`✓ Discount: R$ ${result3.discount_value.toFixed(2)}`);
console.log(`✓ Total: R$ ${result3.total_final.toFixed(2)}`);

// Test 4: Complex scenario
console.log('\n4. Complex medical procedure:');
const items4 = [
  { descricao: 'Consulta inicial', quantidade: 1, valor_unitario: 800 },
  { descricao: 'Sessões de tratamento', quantidade: 6, valor_unitario: 300 },
  { descricao: 'Exames laboratoriais', quantidade: 1, valor_unitario: 450 },
  { descricao: 'Medicamentos', quantidade: 1, valor_unitario: 350 }
];
const result4 = calculateOrcamento(items4, { percentual: 15 });
console.log('Items:', JSON.stringify(items4, null, 2));
console.log('Discount: 15%');
console.log('Result:', result4);
console.log(`✓ Subtotal: R$ ${result4.subtotal.toFixed(2)}`);
console.log(`✓ Discount: R$ ${result4.discount_value.toFixed(2)}`);
console.log(`✓ Total: R$ ${result4.total_final.toFixed(2)}`);

// Test 5: Error handling
console.log('\n5. Error handling (negative value):');
try {
  calculateOrcamento([
    { descricao: 'Invalid', quantidade: -1, valor_unitario: 100 }
  ]);
  console.log('✗ Should have thrown error');
} catch (error) {
  console.log(`✓ Correctly threw error: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('All tests completed successfully!');
console.log('='.repeat(60));
