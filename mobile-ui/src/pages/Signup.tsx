import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  FormGroup,
  FormControl,
  FormHelperText,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  // const [errors, setErrors] = useState<any>({});

  // const validateForm = () => {
  //   const newErrors:any = {};

  //   if (!name.trim()) newErrors.name = "Name is required";

  //   if (!email.trim()) newErrors.email = "Email is required";
  //   else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";

  //   if (!password.trim()) newErrors.password = "Password is required";
  //   else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const handleRegistration = async (e: any) => {
    e.preventDefault();

    // if (!validateForm()) return; // Stop if validation fails

    try {
      const response = await axios.post(
        "https://cpdoznq25i.execute-api.us-west-2.amazonaws.com/prod/users/register",
        { name, email, password },
      );
      navigate("/login");
      console.log("Registration successful:", response.data);
    } catch (e) {
      console.error("Registration failed:", e);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEF8F7",
        padding: "16px",
      }}
    >
      <form onSubmit={handleRegistration}>
        <Box
          sx={{
            maxWidth: "400px",
            width: "100%",
            padding: "32px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
            backgroundColor: "#fff",
          }}
        >
          <Typography
            variant="h4"
            color="#3F8782"
            gutterBottom
            textAlign="center"
          >
            Create Account
          </Typography>

          <FormGroup>
            <FormControl>
              <TextField
                fullWidth
                label="Name"
                margin="normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormControl>

            <FormControl>
              <TextField
                fullWidth
                label="Email"
                margin="normal"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormControl>

            <FormControl>
              <TextField
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputProps={{ minLength: 6 }}
              />
            </FormControl>
          </FormGroup>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              borderRadius: "50px",
              backgroundColor: "#3F8782",
              "&:hover": { backgroundColor: "#35726E" },
            }}
          >
            Signup
          </Button>

          <Typography variant="body2" textAlign="center" mt={2}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#3F8782" }}>
              Log In
            </a>
          </Typography>
        </Box>
      </form>
    </Box>
  );
}
