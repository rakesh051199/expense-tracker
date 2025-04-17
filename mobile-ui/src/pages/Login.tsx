import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogin = async (e: any) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "https://cpdoznq25i.execute-api.us-west-2.amazonaws.com/prod/users/login",
        { email, password },
        { withCredentials: true },
      );
      console.log("Login successful:", response.data);
      setUser(response.data.user);
      navigate("/home");
    } catch (e) {
      alert(`Login failed:, ${e}`);
      console.error("Login failed:", e);
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
      <form onSubmit={handleLogin}>
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
            textAlign="center"
            gutterBottom
          >
            Login
          </Typography>
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="contained"
            type="submit"
            fullWidth
            sx={{
              mt: 2,
              borderRadius: "50px",
              backgroundColor: "#3F8782",
              "&:hover": { backgroundColor: "#35726E" },
            }}
          >
            Login
          </Button>
        </Box>
      </form>
    </Box>
  );
}
