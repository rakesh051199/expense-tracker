import { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  MenuItem,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function AddExpense() {
  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    description: "",
    type: "expense",
    userId: "",
  });
  const { user, categories }: any = useUser();
  const navigate = useNavigate();

  const handleChange = (field: any) => (e: any) => {
    const value =
      field === "amount" ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddExpense = async (e: any) => {
    e.preventDefault();
    console.log(form);
    form.userId = user.id;
    try {
      const response = await axios.post(
        "https://cpdoznq25i.execute-api.us-west-2.amazonaws.com/prod/transactions",
        form,
        { withCredentials: true },
      );
      console.log("Expense added successfully", response.data);
    } catch (e) {
      console.error("Expense addition failed", e);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user]);

  return (
    <Box
      sx={{
        maxWidth: 480,
        margin: "auto",
        bgcolor: "#F9F9F9",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: 96,
          bgcolor: "#2A7C76",
          padding: 2,
          borderRadius: "0 0 32px 32px",
        }}
      >
        <IconButton sx={{ color: "white" }}>
          <ArrowBackIosIcon />
        </IconButton>
        {["income", "expense"].map((type) => (
          <Typography
            key={type}
            variant="h6"
            color="white"
            fontWeight={600}
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                type,
                category: categories[type][0],
                amount: "",
              }))
            }
          >
            {form.type === type && <CheckCircleIcon sx={{ mr: 1 }} />}
            {type}
          </Typography>
        ))}
      </Box>

      <form onSubmit={handleAddExpense}>
        {/* Form */}
        <Box padding={3}>
          {/* Category Dropdown */}
          <Typography variant="body2" color="text.secondary" mb={1}>
            Category
          </Typography>
          <TextField
            select
            fullWidth
            value={form.category}
            onChange={handleChange("category")}
            variant="outlined"
            required
          >
            {categories[form.type].map((option: any) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          {/* Amount Input */}
          <Typography variant="body2" color="text.secondary" mt={3} mb={1}>
            Amount
          </Typography>
          <TextField
            fullWidth
            value={form.amount}
            onChange={handleChange("amount")}
            placeholder="$ 48.00"
            required
            type="number"
            // inputProps={{ min: 0 }}
          />

          {/* Description Input */}
          <Typography variant="body2" color="text.secondary" mt={3} mb={1}>
            Description
          </Typography>
          <TextField
            fullWidth
            value={form.description}
            onChange={handleChange("description")}
            placeholder="Description"
            required
          />

          <Box mt={4}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                padding: "12px 24px",
                fontWeight: 600,
                backgroundColor: "#2A7C76",
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}
