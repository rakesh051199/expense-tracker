import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";

interface BudgetPopupProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedCategory: string;
  monthlyLimit: number | undefined;
  setMonthlyLimit: (limit: number | undefined) => void;
  user: { id: string } | null;
  setBudgets: (budgets: any) => void;
  isUpdate: boolean;
  setIsUpdate: (update: boolean) => void;
}

export default function BudgetPopup({
  isOpen,
  setIsOpen,
  selectedCategory,
  monthlyLimit,
  setMonthlyLimit,
  user,
  setBudgets,
  isUpdate,
  setIsUpdate,
}: BudgetPopupProps) {
  const [loading, setLoading] = useState(false);

  const validateInputs = (): boolean => {
    if (!monthlyLimit || monthlyLimit <= 0 || monthlyLimit > 1000000) {
      alert(
        "Please enter a valid monthly limit (greater than 0 and less than 1,000,000)",
      );
      return false;
    }
    if (!selectedCategory) {
      alert("Please select a category");
      return false;
    }
    return true;
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);

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

      const newBudget = {
        category: selectedCategory,
        monthlyLimit,
        totalSpent: 0,
      };
      setBudgets((prev: any) => [...prev, newBudget]);
      setIsOpen(false);
      console.log("Budget created successfully:", response.data);
    } catch (error) {
      console.error("Error creating budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);

    const payload = {
      category: selectedCategory,
      monthlyLimit,
      userId: user?.id,
    };

    try {
      const response = await axios.patch(
        "https://cpdoznq25i.execute-api.us-west-2.amazonaws.com/prod/budgets",
        payload,
        { withCredentials: true },
      );

      setBudgets((prev: any) =>
        prev.map((budget: any) =>
          budget.category === selectedCategory
            ? { ...budget, monthlyLimit }
            : budget,
        ),
      );
      setIsOpen(false);
      setIsUpdate(false);
      console.log("Budget updated successfully:", response.data);
    } catch (error) {
      console.error("Error updating budget:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogTitle textAlign="center">
        {isUpdate ? "Update Budget" : "Set Budget"}
      </DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="h6" textAlign="center">
            {selectedCategory}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography>Limit:</Typography>
          <TextField
            fullWidth
            placeholder="0"
            type="number"
            value={monthlyLimit || ""}
            onChange={(e) => setMonthlyLimit(Number(e.target.value))}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Box display="flex" gap={2} justifyContent="center" width="100%">
          <Button
            variant="outlined"
            onClick={() => {
              setIsOpen(false);
              setIsUpdate(false);
            }}
          >
            CANCEL
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={isUpdate ? handleBudgetUpdate : handleBudgetSubmit}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : isUpdate ? (
              "UPDATE"
            ) : (
              "SET"
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
