function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * INPUT (exemplo):
 * {
 *   portions: 1,
 *   ingredients: [
 *     { name: "Cebola", purchasePrice: 10, purchaseUnit: "kg", purchaseQty: 1, recipeQty: 80, recipeUnit: "g", yieldPct: 85 }
 *   ],
 *   labor: { minutesPerPortion: 6, hourlyWage: 18 },
 *   overhead: { pctOfSales: 12 }, // % do preço de venda
 *   taxes: { pctOfSales: 8 },     // % do preço de venda
 *   targetFoodCostPct: 30         // objetivo de CMV/Preço (%)
 * }
 */
function calculatePrice(input) {
  const portions = Math.max(1, toNumber(input?.portions, 1));
  const targetFoodCostPct = toNumber(input?.targetFoodCostPct, 30); // %
  const ingredients = Array.isArray(input?.ingredients) ? input.ingredients : [];

  // 1) Custo de ingredientes (com yield/perda)
  let ingredientsCostTotal = 0;

  const ingredientsBreakdown = ingredients.map((ing) => {
    const purchasePrice = toNumber(ing.purchasePrice); // R$
    const purchaseQty = toNumber(ing.purchaseQty, 1);  // ex: 1 kg
    const recipeQty = toNumber(ing.recipeQty);         // ex: 80 g
    const yieldPct = toNumber(ing.yieldPct, 100);      // ex: 85 (%)

    // custo por unidade comprada (ex: R$/kg)
    const costPerPurchaseUnit = purchaseQty > 0 ? purchasePrice / purchaseQty : 0;

    // conversão simples (kg<->g, l<->ml). Se não casar, assume mesma unidade.
    const purchaseUnit = String(ing.purchaseUnit || "").toLowerCase();
    const recipeUnit = String(ing.recipeUnit || "").toLowerCase();

    let recipeQtyInPurchaseUnit = recipeQty;

    // kg -> g
    if (purchaseUnit === "kg" && recipeUnit === "g") recipeQtyInPurchaseUnit = recipeQty / 1000;
    // g -> kg
    if (purchaseUnit === "g" && recipeUnit === "kg") recipeQtyInPurchaseUnit = recipeQty * 1000;

    // l -> ml
    if (purchaseUnit === "l" && recipeUnit === "ml") recipeQtyInPurchaseUnit = recipeQty / 1000;
    // ml -> l
    if (purchaseUnit === "ml" && recipeUnit === "l") recipeQtyInPurchaseUnit = recipeQty * 1000;

    // Ajuste de perda: se yield=85%, precisa comprar mais para render a receita
    const yieldFactor = yieldPct > 0 ? (100 / yieldPct) : 1;
    const adjustedQty = recipeQtyInPurchaseUnit * yieldFactor;

    const cost = costPerPurchaseUnit * adjustedQty;

    ingredientsCostTotal += cost;

    return {
      name: ing.name || "Ingrediente",
      cost: round2(cost),
      details: {
        purchasePrice,
        purchaseQty,
        purchaseUnit,
        recipeQty,
        recipeUnit,
        yieldPct,
        adjustedQty: round2(adjustedQty),
      },
    };
  });

  const foodCostPerPortion = ingredientsCostTotal / portions;

  // 2) Mão de obra por porção
  const laborMinutes = toNumber(input?.labor?.minutesPerPortion, 0);
  const hourlyWage = toNumber(input?.labor?.hourlyWage, 0);
  const laborCostPerPortion = (laborMinutes / 60) * hourlyWage;

  // 3) Custo direto por porção
  const directCostPerPortion = foodCostPerPortion + laborCostPerPortion;

  // 4) Precificação: alvo de Food Cost (%)
  // Preço base recomendado pelo alvo (ex: 30% => preço = custo_food / 0.30)
  const targetRate = targetFoodCostPct > 0 ? targetFoodCostPct / 100 : 0.3;
  const basePriceByFoodCost = foodCostPerPortion / targetRate;

  // 5) Impostos e custos operacionais como % do preço de venda
  const overheadPct = toNumber(input?.overhead?.pctOfSales, 0) / 100;
  const taxesPct = toNumber(input?.taxes?.pctOfSales, 0) / 100;

  // Para incluir percentuais no preço final:
  // preço_final = preço_base / (1 - overheadPct - taxesPct)
  const denom = 1 - overheadPct - taxesPct;
  const recommendedPrice = denom > 0 ? (basePriceByFoodCost / denom) : basePriceByFoodCost;

  // 6) Métricas finais
  const finalPrice = round2(recommendedPrice);

  const estimatedFoodCostPct = finalPrice > 0 ? (foodCostPerPortion / finalPrice) * 100 : 0;
  const estimatedGrossMarginPct = finalPrice > 0 ? ((finalPrice - directCostPerPortion) / finalPrice) * 100 : 0;

  return {
    portions,
    costs: {
      foodCostPerPortion: round2(foodCostPerPortion),
      laborCostPerPortion: round2(laborCostPerPortion),
      directCostPerPortion: round2(directCostPerPortion),
    },
    price: {
      recommended: finalPrice,
      baseByFoodCost: round2(basePriceByFoodCost),
    },
    pct: {
      targetFoodCostPct: round2(targetFoodCostPct),
      estimatedFoodCostPct: round2(estimatedFoodCostPct),
      overheadPct: round2(overheadPct * 100),
      taxesPct: round2(taxesPct * 100),
      estimatedGrossMarginPct: round2(estimatedGrossMarginPct),
    },
    breakdown: {
      ingredients: ingredientsBreakdown,
    },
  };
}

module.exports = { calculatePrice };
