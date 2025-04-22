import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { PieChart, Tooltip, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { generateMonths } from "../utils/util";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { CircularProgress, IconButton } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Analytics() {
  const { user }: any = useUser();
  const months = generateMonths(2023, 2025);
  const navigate = useNavigate();

  const currentDate = new Date();
  const currentMonthIndex = months.findIndex(
    (month) =>
      month.year === currentDate.getFullYear() &&
      month.month === currentDate.getMonth() + 1,
  );

  const [selectedMonthIndex, setSelectedMonthIndex] =
    useState(currentMonthIndex);

  const displayViews = [
    "Expense overview",
    "Income overview",
    "Account Analysis",
  ];
  const [selectedView, setSelectedView] = useState(displayViews[0]);

  const handleChange = (event: any) => {
    setSelectedView(event.target.value);
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["transactions", user?.id, months[selectedMonthIndex]],
    queryFn: async () => {
      const selectedMonth = months[selectedMonthIndex];
      const response = await axios.get(
        `https://6m1sem7dp0.execute-api.us-west-2.amazonaws.com/prod/transactions?userId=${user?.id}&year=${selectedMonth.year}&month=${selectedMonth.month}`,
        { withCredentials: true },
      );
      return response.data;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isError) {
    console.error("Transactions fetch failed:", error);
    toast.error("Failed to load transactions. Please try again later.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  }

  const transactions = Array.isArray(data?.transactions)
    ? data.transactions
    : [];

  // Helper function to group transactions by category
  const groupByCategory = (transactions: any[], totalAmount: any) => {
    const grouped: { [key: string]: number } = {};
    transactions.forEach((transaction) => {
      if (transaction.category && transaction.amount) {
        grouped[transaction.category] =
          (grouped[transaction.category] || 0) + transaction.amount;
      }
    });
    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value: (value / totalAmount) * 100,
      color: getRandomColor(),
    }));
  };

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Filter and group transactions
  const expenseTransactions = transactions.filter(
    (transaction: any) => transaction.type === "expense",
  );
  const incomeTransactions = transactions.filter(
    (transaction: any) => transaction.type === "income",
  );
  const totalIncome = data?.totalIncome || 0;
  const totalExpense = data?.totalExpense || 0;

  const expenseData = groupByCategory(expenseTransactions, totalExpense);
  const incomeData = groupByCategory(incomeTransactions, totalIncome);

  const renderLegend = (data: any[]) => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems={{ xs: "center", sm: "flex-start" }}
      sx={{
        mt: { xs: 2, sm: 0 },
        ml: { xs: 0, sm: 4 },
        width: { xs: "100%", sm: "auto" },
      }}
    >
      {data.map((item) => (
        <Box key={item.name} display="flex" alignItems="center" mb={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: item.color,
              borderRadius: "50%",
              mr: 1,
            }}
          />
          <Typography variant="body2">{item.name}</Typography>
        </Box>
      ))}
    </Box>
  );

  const handlePrevMonth = () => {
    setSelectedMonthIndex((prev) =>
      prev === months.length - 1 ? prev : prev + 1,
    );
  };

  const handleNextMonth = () => {
    setSelectedMonthIndex((prev) => (prev === 0 ? prev : prev - 1));
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  useEffect(() => {
    setSelectedMonthIndex(currentMonthIndex);
  }, [currentMonthIndex]);

  return (
    <Box sx={{ backgroundColor: "#EEF8F7", padding: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="center" my={3}>
        <IconButton
          onClick={handlePrevMonth}
          disabled={selectedMonthIndex === months.length - 1}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={600} mx={2}>
          {months[selectedMonthIndex].label}
        </Typography>
        <IconButton
          onClick={handleNextMonth}
          disabled={selectedMonthIndex === 0}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{ pt: 3 }}
      >
        <Select
          labelId="view-select-label"
          id="view-select"
          value={selectedView}
          onChange={handleChange}
          sx={{
            width: { xs: "90%", sm: 400 },
            mb: 2,
          }}
        >
          {displayViews.map((view) => (
            <MenuItem key={view} value={view}>
              {view}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {isLoading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
          }}
        >
          <CircularProgress sx={{ color: "#2A7C76" }} />
        </Box>
      )}

      {transactions.length === 0 && !isLoading && (
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign={"center"}
          sx={{ mt: 2 }}
        >
          No Transactions available
        </Typography>
      )}

      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="center"
        alignItems="center"
        sx={{ mt: 4 }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ maxWidth: 350 }}
        >
          <Typography
            variant="h5"
            color="#3F8782"
            fontWeight="bold"
            sx={{ mb: 2 }}
          >
            {selectedView === "Expense overview"
              ? "Expense Overview"
              : "Income Overview"}
          </Typography>
          <PieChart width={300} height={300}>
            <Tooltip />
            <Pie
              data={
                selectedView === "Expense overview" ? expenseData : incomeData
              }
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              isAnimationActive={false}
            >
              {(selectedView === "Expense overview"
                ? expenseData
                : incomeData
              ).map((entry, index) => (
                <Cell key={`slice-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </Box>
        {renderLegend(
          selectedView === "Expense overview" ? expenseData : incomeData,
        )}
      </Box>
    </Box>
  );
}

export default Analytics;
