import { useState } from "react";
import { useUser } from "../context/UserContext";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  TextField,
} from "@mui/material";
import axios from "axios";

export default function Budget() {
  const { categories, user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState<undefined | number>();

  const handleBudgetSubmit = async (e: any) => {
    if (!monthlyLimit) {
      alert("Please enter a valid monthly limit");
      return;
    }
    if (!selectedCategory) {
      alert("Please select a category");
      return;
    }
    if (monthlyLimit < 0) {
      alert("Please enter a valid monthly limit");
      return;
    }
    if (monthlyLimit > 1000000) {
      alert("Please enter a valid monthly limit");
      return;
    }

    e.preventDefault();
    const payload = {
      category: selectedCategory,
      monthlyLimit,
      userId: user?.id,
    };
    try {
      const response = await axios.post(
        "https://cpdoznq25i.execute-api.us-west-2.amazonaws.com/prod/budgets",
        payload,
        { withCredentials: true },
      );
      setIsOpen(false);
      console.log(response);
    } catch (e) {
      console.error(e);
    }
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
      <Dialog open={isOpen}>
        <DialogTitle textAlign={"center"}>Set budget</DialogTitle>
        <DialogContent>
          <Box>{selectedCategory}</Box>
          <Box display={"flex"} alignItems={"center"} gap={1}>
            <Typography>Limit:</Typography>
            <TextField
              fullWidth
              placeholder="0"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(Number(e.target.value))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Box display={"flex"} gap={2} justifyContent={"center"} width="100%">
            <Button variant="outlined" onClick={() => setIsOpen(false)}>
              CANCEL
            </Button>
            <Button variant="outlined" onClick={handleBudgetSubmit}>
              SET
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      {categories.expense.map((category: any, index: number) => (
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
            }}
          >
            Set Budget
          </Button>
        </Card>
      ))}
    </Box>
  );
}
