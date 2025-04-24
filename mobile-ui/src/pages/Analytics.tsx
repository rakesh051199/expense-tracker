import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {
  PieChart,
  Tooltip,
  Pie,
  Cell,
  BarChart,
  Legend,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import { generateMonths, groupByCategory } from "../utils/util";
import { useUser } from "../context/UserContext";
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import MonthSelector from "./MonthSelector";
import { useTransactions } from "../api/hooks";

function Analytics() {
  const { user, categories }: any = useUser();
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

  const { data, isLoading, isError, error } = useTransactions(
    user?.id,
    months[selectedMonthIndex],
  );

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

  // Filter and group transactions
  const expenseTransactions = transactions.filter(
    (transaction: any) => transaction.type === "expense",
  );
  const incomeTransactions = transactions.filter(
    (transaction: any) => transaction.type === "income",
  );
  const totalIncome = data?.totalIncome || 0;
  const totalExpense = data?.totalExpense || 0;

  const expenseData = groupByCategory(
    expenseTransactions,
    totalExpense,
    categories.expense,
  );
  const incomeData = groupByCategory(
    incomeTransactions,
    totalIncome,
    categories.income,
  );

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

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  const chartData = [
    { name: "Expense", value: totalExpense, fill: "#F44336" }, // Red for Expense
    { name: "Income", value: totalIncome, fill: "#4CAF50" }, // Green for Income
  ];

  useEffect(() => {
    setSelectedMonthIndex(currentMonthIndex);
  }, [currentMonthIndex]);

  return (
    <Box sx={{ backgroundColor: "#EEF8F7", padding: 2 }}>
      <MonthSelector
        months={months}
        selectedMonthIndex={selectedMonthIndex}
        setSelectedMonthIndex={setSelectedMonthIndex}
      />

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
        {selectedView === "Account Analysis" ? (
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
              Account Analysis
            </Typography>
            <BarChart width={300} height={300} data={chartData}>
              <Tooltip />
              <Legend />
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="value" />
            </BarChart>
          </Box>
        ) : (
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
                label={false}
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
        )}
      </Box>
      {renderLegend(
        selectedView === "Expense overview"
          ? expenseData
          : selectedView === "Income overview"
            ? incomeData
            : chartData,
      )}
    </Box>
  );
}

export default Analytics;
