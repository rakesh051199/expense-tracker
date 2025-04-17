export const generateMonths = (startYear: number, endYear: number) => {
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
