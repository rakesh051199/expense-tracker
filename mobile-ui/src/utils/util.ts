const generateMonths = (startYear: number, endYear: number) => {
  const months = [];
  for (let year = endYear; year >= startYear; year--) {
    for (let month = 11; month >= 0; month--) {
      const date = new Date(year, month);
      months.push({
        label: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        year: year,
        month: month + 1,
      });
    }
  }
  return months;
};

// Helper function to group transactions by category
const groupByCategory = (
  transactions: any[],
  totalAmount: any,
  categories: any,
) => {
  const grouped: { [key: string]: number } = {};
  transactions.forEach((transaction) => {
    if (transaction.category && transaction.amount) {
      grouped[transaction.category] =
        (grouped[transaction.category] || 0) + transaction.amount;
    }
  });
  const categoryColorMap = categories.reduce((acc: any, category: any) => {
    acc[category.name] = category.color;
    return acc;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value: parseFloat(((value / totalAmount) * 100).toFixed(2)), // Limit to 1 decimal place
    color: categoryColorMap[name] || "#000000", // Default color if not found
  }));
};

export { generateMonths, groupByCategory };
