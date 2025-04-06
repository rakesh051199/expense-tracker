import { useState } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Fab,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalculateIcon from "@mui/icons-material/Calculate";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const [value, setValue] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate("/home");
        break;
      case 1:
        navigate("/analytics");
        break;
      case 4:
        navigate("/profile");
        break;
      case 3:
        navigate("/budget");
        break;
      default:
        break;
    }
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation value={value} onChange={handleChange} showLabels>
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Analytics" icon={<BarChartIcon />} />

        {/* Centered Add Button */}
        {location.pathname !== "/" && (
          <Fab
            aria-label="add"
            onClick={() => navigate("/add")}
            sx={{
              position: "absolute",
              top: -25,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2000,
              backgroundColor: "#2A7C76", // Green color
              color: "white",
              "&:hover": { backgroundColor: "#35726E" },
            }}
          >
            <AddIcon />
          </Fab>
        )}
        <BottomNavigationAction label="Budgets" icon={<CalculateIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
