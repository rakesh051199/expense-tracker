import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useUser } from "../context/UserContext";

export default function AddExpense() {
  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    description: "",
    type: "expense",
    userId: "",
  });
  const [loading, setLoading] = useState(false);
  const { user, categories }: any = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleChange = (field: any) => (e: any) => {
    const value =
      field === "amount" ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddExpense = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    form.userId = user.id;
    try {
      await axios.post(
        "https://6m1sem7dp0.execute-api.us-west-2.amazonaws.com/prod/transactions",
        form,
        { withCredentials: true },
      );
      queryClient.invalidateQueries(["transactions", user?.id] as any); // Invalidate the transactions query to refetch data
      navigate("/home");
    } catch (e) {
      console.error("Transaction addition failed", e);
      toast.error("Failed to add Transaction. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setLoading(false);
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
        backgroundColor: "#EEF8F7",
        minHeight: "100vh",
      }}
    >
      <ToastContainer />

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
          />

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
              disabled={loading}
            >
              {loading ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} sx={{ color: "white" }} />
                  Saving...
                </Box>
              ) : (
                "Save"
              )}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}
