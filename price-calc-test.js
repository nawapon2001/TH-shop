// Helper function to recalculate price based on product options
function recalculateProductPrice(basePrice, selectedOptions, productOptions, discountPercent = 0) {
  if (!productOptions || productOptions.length === 0) {
    // No options, use base price with discount
    return discountPercent > 0 
      ? Math.round(basePrice * (1 - discountPercent / 100))
      : basePrice;
  }
  
  let finalPrice = basePrice;
  
  productOptions.forEach(option => {
    const selectedValue = selectedOptions?.[option.name];
    if (selectedValue) {
      const selectedOptionValue = option.values.find(v => v.value === selectedValue);
      if (selectedOptionValue) {
        if (selectedOptionValue.priceType === 'replace') {
          finalPrice = selectedOptionValue.price;
        } else {
          finalPrice += selectedOptionValue.price;
        }
      }
    }
  });
  
  // Apply discount to final calculated price
  return discountPercent > 0 
    ? Math.round(finalPrice * (1 - discountPercent / 100))
    : finalPrice;
}

// Test cases
console.log('Testing price calculation:');

// Test 1: No options, no discount
console.log('Test 1:', recalculateProductPrice(299, {}, [])); // Should be 299

// Test 2: With options (add)
const options1 = [{
  name: 'ขนาด',
  values: [
    { value: 'S', price: 0, priceType: 'add' },
    { value: 'M', price: 50, priceType: 'add' },
    { value: 'L', price: 100, priceType: 'add' }
  ]
}];
console.log('Test 2:', recalculateProductPrice(299, { 'ขนาด': 'M' }, options1)); // Should be 349

// Test 3: With options (replace)
const options2 = [{
  name: 'ขนาด',
  values: [
    { value: 'S', price: 250, priceType: 'replace' },
    { value: 'M', price: 350, priceType: 'replace' },
    { value: 'L', price: 450, priceType: 'replace' }
  ]
}];
console.log('Test 3:', recalculateProductPrice(299, { 'ขนาด': 'M' }, options2)); // Should be 350

// Test 4: With discount
console.log('Test 4:', recalculateProductPrice(299, {}, [], 10)); // Should be 269 (299 * 0.9)

// Test 5: With options and discount
console.log('Test 5:', recalculateProductPrice(299, { 'ขนาด': 'M' }, options1, 10)); // Should be 314 (349 * 0.9)

export { recalculateProductPrice };
