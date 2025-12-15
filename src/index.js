const { calculatePrice } = require("./services/pricingEngine");

// Exemplo real simples: 1 porção de hamburguer com cebola
const result = calculatePrice({
  portions: 1,
  ingredients: [
    // Cebola: R$10/kg, receita usa 80g, rendimento 85% (perda ao descascar)
    { name: "Cebola", purchasePrice: 10, purchaseUnit: "kg", purchaseQty: 1, recipeQty: 80, recipeUnit: "g", yieldPct: 85 },

    // Carne: R$36/kg, receita 160g, rendimento 100%
    { name: "Carne", purchasePrice: 36, purchaseUnit: "kg", purchaseQty: 1, recipeQty: 160, recipeUnit: "g", yieldPct: 100 },

    // Pão: R$1,20 unidade, receita 1 un, rendimento 100%
    { name: "Pão", purchasePrice: 1.2, purchaseUnit: "un", purchaseQty: 1, recipeQty: 1, recipeUnit: "un", yieldPct: 100 },
  ],
  labor: { minutesPerPortion: 6, hourlyWage: 18 },
  overhead: { pctOfSales: 12 },
  taxes: { pctOfSales: 8 },
  targetFoodCostPct: 30,
});

console.log(JSON.stringify(result, null, 2));
