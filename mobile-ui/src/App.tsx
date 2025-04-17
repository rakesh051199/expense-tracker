import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages//Login";
import Signup from "./pages//Signup";
import Profile from "./pages//Profile";
import Home from "./pages/Home";
import AddExpense from "./pages/AddExpense";
import BottomNav from "./components/BottomNav";
import "./App.css";
import { UserProvider } from "./context/UserContext";
import Budget from "./pages/Budget";
import { Box } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <UserProvider>
          <Box sx={{ pb: "24px" /* Adjust based on BottomNav height */ }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/home" element={<Home />} />
              <Route path="/add" element={<AddExpense />} />
              <Route path="/budget" element={<Budget />} />
            </Routes>
          </Box>
          <BottomNav />
        </UserProvider>
      </Router>
    </QueryClientProvider>
  );
}
