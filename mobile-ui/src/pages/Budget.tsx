import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import LinearProgress from "@mui/material/LinearProgress";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import HomeIcon from "@mui/icons-material/Home";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import OtherHousesIcon from "@mui/icons-material/OtherHouses";
import EditIcon from "@mui/icons-material/Edit";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generateMonths } from "../utils/util";
import BudgetPopup from "../components/BudgetPopup";
import { useUser } from "../context/UserContext";
import MonthSelector from "./MonthSelector";
import { useBudgets } from "../api/hooks";

export default function Budget() {
  const { categories, user }: any = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState<undefined | number>();
  const [budgets, setBudgets] = useState<any>([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const navigate = useNavigate();
  const isInitialized = useRef(false);

  const months = generateMonths(2023, 2025);
  const currentDate = new Date();
  const currentMonthIndex = months.findIndex(
    (month) =>
      month.year === currentDate.getFullYear() &&
      month.month === currentDate.getMonth() + 1,
  );
  const [selectedMonthIndex, setSelectedMonthIndex] =
    useState(currentMonthIndex);

  const {
    data: budgetsData,
    isLoading,
    isError,
    error,
  } = useBudgets(user?.id, months[selectedMonthIndex]);

  if (isError) {
    console.error("Budgets fetch failed:", error);
    toast.error("Failed to fetch budgets. Please try again.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  }

  const categoryIcons: { [key: string]: any } = {
    Shopping: <ShoppingCartIcon sx={{ color: "#3F8782" }} />,
    Food: <RestaurantIcon sx={{ color: "#3F8782" }} />,
    Housing: <HomeIcon sx={{ color: "#3F8782" }} />,
    Transportation: <DirectionsCarIcon sx={{ color: "#3F8782" }} />,
    Other: <OtherHousesIcon sx={{ color: "#3F8782" }} />,
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  useEffect(() => {
    console.log("Budgets fetched successfully:", budgetsData);
    if (!isInitialized.current && !isLoading) {
      setBudgets(budgetsData);
      isInitialized.current = true;
    }
  }, [budgetsData]);

  useEffect(() => {
    isInitialized.current = false;
  }, [selectedMonthIndex]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: "center",
        padding: 2,
        mb: 2,
        backgroundColor: "#EEF8F7",
      }}
    >
      <MonthSelector
        months={months}
        selectedMonthIndex={selectedMonthIndex}
        setSelectedMonthIndex={setSelectedMonthIndex}
      />

      <ToastContainer />
      <Box>
        <Typography
          variant="h4"
          fontWeight={600}
          color="#3F8782"
          textAlign="center"
          mb={2}
        >
          Budgeted Categories
        </Typography>
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
        {budgets.map((budget: any, index: number) => {
          const remaining = budget.monthlyLimit - budget.totalSpent;
          const progress = Math.min(
            (budget.totalSpent / budget.monthlyLimit) * 100,
            100,
          );

          return (
            <Card
              key={index}
              sx={{
                width: { xs: "100%", sm: "90%", md: "75%" },
                margin: "8px auto",
                padding: 2,
                borderRadius: 2,
                boxShadow: 3,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                {categoryIcons[budget.category] || (
                  <OtherHousesIcon sx={{ color: "#3F8782" }} />
                )}
                <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                  {budget.category}
                </Typography>
                <IconButton>
                  <Tooltip title="Edit Budget">
                    <EditIcon
                      sx={{ color: "#3F8782" }}
                      onClick={() => {
                        setIsOpen(true);
                        setSelectedCategory(budget.category);
                        setMonthlyLimit(budget.monthlyLimit);
                        setIsUpdate(true);
                      }}
                    />
                  </Tooltip>
                </IconButton>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Monthly Limit: ${budget.monthlyLimit}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Spent: ${budget.totalSpent}
                </Typography>
                <Typography
                  variant="body2"
                  color={remaining >= 0 ? "green" : "red"}
                  fontWeight={600}
                >
                  Remaining: ${remaining >= 0 ? remaining : 0}
                </Typography>
              </Box>
              {/* Progress Bar */}
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#E0E0E0",
                  "& .MuiLinearProgress-bar": {
                    background: `linear-gradient(to right, ${
                      progress > 80 ? "#FF6F61" : "#3F8782"
                    }, #2A7C76)`,
                  },
                }}
              />
            </Card>
          );
        })}
      </Box>

      <Typography variant="h4" fontWeight={600} color="#3F8782">
        Not budgeted categories
      </Typography>
      {categories.expense
        .filter((category: any) => {
          return !budgets.some(
            (budget: any) => budget.category === category.name,
          );
        })
        .map((category: any, index: number) => (
          <Card
            key={index}
            sx={{
              width: { xs: "90%", sm: "75%", md: "60%" }, // Responsive width
              padding: 1.5,
              borderRadius: 2,
              boxShadow: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              {categoryIcons[category.name] || (
                <OtherHousesIcon sx={{ color: "#3F8782" }} />
              )}
              <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                {category.name}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{ ml: 2, backgroundColor: "#2A7C76" }}
              onClick={() => {
                setIsOpen(true);
                setSelectedCategory(category.name);
                setMonthlyLimit(undefined);
              }}
            >
              Set Budget
            </Button>
          </Card>
        ))}
      <BudgetPopup
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        selectedCategory={selectedCategory}
        monthlyLimit={monthlyLimit}
        user={user}
        setMonthlyLimit={setMonthlyLimit}
        setBudgets={setBudgets}
        isUpdate={isUpdate}
        setIsUpdate={setIsUpdate}
        categoryIcon={
          categoryIcons[selectedCategory] || (
            <OtherHousesIcon sx={{ color: "#3F8782" }} />
          )
        }
      />
    </Box>
  );
}
