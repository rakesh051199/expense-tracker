import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { generateMonths } from "../utils/util";

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
  const { user }: any = useUser();
  const navigate = useNavigate();
  const months = generateMonths(2023, 2025);

  const currentDate = new Date();
  const currentMonthIndex = months.findIndex(
    (month) =>
      month.year === currentDate.getFullYear() &&
      month.month === currentDate.getMonth() + 1,
  );

  const [selectedMonthIndex, setSelectedMonthIndex] =
    useState(currentMonthIndex);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["transactions", user?.id, months[selectedMonthIndex]],
    queryFn: async () => {
      const selectedMonth = months[selectedMonthIndex];
      const response = await axios.get(
        `https://cpdoznq25i.execute-api.us-west-2.amazonaws.com/prod/transactions?userId=${user?.id}&year=${selectedMonth.year}&month=${selectedMonth.month}`,
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
  const totalIncome = data?.totalIncome || 0;
  const totalExpense = data?.totalExpense || 0;
  const totalBalance = totalIncome - totalExpense;

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
      <ToastContainer />
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
            {isLoading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: "#fff",
                }}
              />
            ) : (
              `$${totalBalance.toFixed(2)}`
            )}
          </Typography>

          <Stack direction="row" justifyContent="space-between" mt={2}>
            <InfoCard
              icon={<ArrowDownwardIcon />}
              label="Income"
              amount={
                isLoading ? (
                  <CircularProgress sx={{ color: "#fff" }} />
                ) : (
                  totalIncome
                )
              }
            />
            <InfoCard
              icon={<ArrowUpwardIcon />}
              label="Expenses"
              amount={
                isLoading ? (
                  <CircularProgress sx={{ color: "#fff" }} />
                ) : (
                  totalExpense
                )
              }
            />
          </Stack>
        </Box>
      </Box>

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

      {isLoading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
          }}
        >
          <CircularProgress sx={{ color: "#fff" }} />
        </Box>
      )}

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
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight={500}>{txn.category}</Typography>
              </Box>
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
