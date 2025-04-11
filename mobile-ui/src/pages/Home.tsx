import { useEffect, useState } from "react";
import { Box, Typography, IconButton, Stack, TextField } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

// ✅ Reusable Component for Income/Expense Card
const InfoCard = ({ icon, label, amount, color }: any) => (
  <Stack alignItems="center" spacing={0.5}>
    <Box display="flex" alignItems="center" gap={1}>
      {icon}
      <Typography>{label}</Typography>
    </Box>
    <Typography variant="h5" fontWeight={600} color={color}>
      {amount}
    </Typography>
  </Stack>
);

export default function Home() {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  const months = ["March 2025", "February 2025", "January 2025"];

  const [transactions, setTransactions] = useState<any>([]);
  const { user }: any = useUser();
  const [totalBalance, setTotalBalance] = useState<undefined | number>(
    undefined,
  );
  const [totalIncome, setTotalIncome] = useState<undefined | number>(undefined);
  const [totalExpense, setTotalExpense] = useState<undefined | number>(
    undefined,
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    async function fetchTransactions() {
      try {
        const response = await axios.get(
          `https://cpdoznq25i.execute-api.us-west-2.amazonaws.com/prod/transactions?userId=${user.id}`,
          { withCredentials: true },
        );
        console.log("Transactions fetched successfully", response.data);
        setTransactions(response.data.transactions);
        setTotalIncome(response.data.totalIncome);
        setTotalExpense(response.data.totalExpense);
        setTotalBalance(response.data.totalIncome - response.data.totalExpense);
      } catch (e) {
        console.error("Transactions fetch failed", e);
        alert("Transactions fetch failed");
      }
    }
    fetchTransactions();
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonthIndex((prev) =>
      prev === months.length - 1 ? prev : prev + 1,
    );
  };

  const handleNextMonth = () => {
    setCurrentMonthIndex((prev) => (prev === 0 ? prev : prev - 1));
  };

  return (
    <Box
      sx={{
        padding: "16px",
        maxWidth: "480px",
        margin: "auto",
        backgroundColor: "#F9F9F9",
        marginBottom: "56px",
        height: "auto",
        fontFamily: "Roboto, sans",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: "#2A7C76",
          padding: "16px",
          height: "200px",
          borderRadius: "12px",
          position: "relative",
          marginBottom: "64px",
        }}
      >
        <Typography variant="h5" color="white" gutterBottom>
          Good afternoon, {user?.name}
        </Typography>

        {/* ✅ Balance Card */}
        <Box
          sx={{
            backgroundColor: "#1E6B64",
            color: "white",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            position: "absolute",
            bottom: "-50px",
            left: "16px",
            right: "16px",
          }}
        >
          <Typography variant="h6">Total Balance</Typography>
          <Typography variant="h4" fontWeight={600}>
            {totalBalance}
          </Typography>

          {/* ✅ Simplified Income & Expenses */}
          <Stack direction="row" justifyContent="space-between" mt={2}>
            <InfoCard
              icon={<ArrowDownwardIcon />}
              label="Income"
              amount={totalIncome}
            />
            <InfoCard
              icon={<ArrowUpwardIcon />}
              label="Expenses"
              amount={totalExpense}
            />
          </Stack>
        </Box>
      </Box>

      {/* ✅ Month Navigator */}
      <Box display="flex" alignItems="center" justifyContent="center" my={3}>
        <IconButton
          onClick={handlePrevMonth}
          disabled={currentMonthIndex === months.length - 1}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={600} mx={2}>
          {months[currentMonthIndex]}
        </Typography>
        <IconButton
          onClick={handleNextMonth}
          disabled={currentMonthIndex === 0}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>

      {transactions.length === 0 ? (
        <Typography variant="body1" color="text.secondary" textAlign={"center"}>
          No Transactions available
        </Typography>
      ) : (
        transactions.map((txn: any) => (
          <Box
            key={txn.transactionId}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            p={1}
            borderRadius="8px"
            sx={{
              backgroundColor: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Box>
              <Typography fontWeight={500}>{txn.type}</Typography>
              <Typography variant="caption" color="gray">
                {txn.createdAt}
              </Typography>
            </Box>
            <Typography
              color={txn.type === "income" ? "green" : "red"}
              fontWeight={600}
            >
              {txn.type === "income" ? "+" : "-"} ${txn.amount?.toFixed(2)}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  );
}
