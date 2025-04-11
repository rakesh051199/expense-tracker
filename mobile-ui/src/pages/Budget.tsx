import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { Box, Card, Typography, Button, IconButton } from "@mui/material";
import axios from "axios";
import { LinearProgress } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import HomeIcon from "@mui/icons-material/Home";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import OtherHousesIcon from "@mui/icons-material/OtherHouses";
import EditIcon from "@mui/icons-material/Edit";
import BudgetPopup from "../components/BudgetPopup";
import { useNavigate } from "react-router-dom";

export default function Budget() {
  const { categories, user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState<undefined | number>();
  const [budgets, setBudgets] = useState<any>([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    async function fetchBudgets() {
      try {
        const response = await axios.get(
          `https://cpdoznq25i.execute-api.us-west-2.amazonaws.com/prod/budgets?userId=${user?.id}`,
          { withCredentials: true },
        );
        console.log("Budgets fetched successfully", response.data);
        setBudgets(response.data);
      } catch (e) {
        console.error("Budgets fetch failed", e);
        alert("Budgets fetch failed");
      }
    }

    fetchBudgets();
  }, [user]);

  const categoryIcons: { [key: string]: any } = {
    Shopping: <ShoppingCartIcon sx={{ color: "#3F8782" }} />,
    Food: <RestaurantIcon sx={{ color: "#3F8782" }} />,
    Housing: <HomeIcon sx={{ color: "#3F8782" }} />,
    Transportation: <DirectionsCarIcon sx={{ color: "#3F8782" }} />,
    Other: <OtherHousesIcon sx={{ color: "#3F8782" }} />,
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: "center",
        padding: 2,
      }}
    >
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
                width: "100%",
                maxWidth: "400px",
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
                  <EditIcon
                    sx={{ color: "#3F8782" }}
                    onClick={() => {
                      setIsOpen(true);
                      setSelectedCategory(budget.category);
                      setMonthlyLimit(budget.monthlyLimit);
                      setIsUpdate(true);
                    }}
                  />
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
                    backgroundColor: progress > 80 ? "#FF6F61" : "#3F8782",
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
          return !budgets.some((budget: any) => budget.category === category);
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
            <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
              {category}
            </Typography>
            <Button
              variant="contained"
              size="small"
              sx={{ ml: 2, backgroundColor: "#2A7C76" }}
              onClick={() => {
                setIsOpen(true);
                setSelectedCategory(category);
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
      />
    </Box>
  );
}
