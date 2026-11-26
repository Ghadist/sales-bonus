/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  let { discount, sale_price, quantity } = purchase;
  let discountDec = discount / 100;
  let totalPrice = sale_price * quantity;
  let totalWithoutDisc = totalPrice * (1 - discountDec);
  return totalWithoutDisc;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  if (index == 0) {
    return 0.15;
  } else if (index == 1 || index == 2) {
    return 0.10;
  } else if (index == total - 1) {
    return 0;
  } else {
    // Для всех остальных
    return 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций

  const { calculateRevenue, calculateBonus } = options;

  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Одна из опций не является функцией");
  }

  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Чего-то не хватает");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  let sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: [],
    bonus: 0,
    top_products: [],
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  let sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller]),
  );
  let productIndex = Object.fromEntries(
    data.products.map((product) => [product.sku, product]),
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца

  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id]; // Продавец
    // Увеличить количество продаж
    seller.sales_count++;
    seller.revenue += record.total_amount;
    // Увеличить общую сумму выручки всех продаж

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      let cost = product.purchase_price * item.quantity;
      let revenue = calculateRevenue(item, product);
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      // Посчитать прибыль: выручка минус себестоимость
      let stonks = revenue - cost;
      seller.profit += stonks;
      // Увеличить общую накопленную прибыль (profit) у продавца

      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
      // По артикулу товара увеличить его проданное количество у продавца
    });
  });

  // @TODO: Сортировка продавцов по прибыли

  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования

  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .toSorted((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
