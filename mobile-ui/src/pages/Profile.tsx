import { Box, Typography, Avatar, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import EmailIcon from "@mui/icons-material/Email";
import ShieldIcon from "@mui/icons-material/Shield";
import LockIcon from "@mui/icons-material/Lock";
import DiamondIcon from "@mui/icons-material/Diamond";
import { useUser } from "../context/UserContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: <DiamondIcon />, label: "Invite Friends" },
  { icon: <AccountCircleIcon />, label: "Account info" },
  { icon: <GroupsIcon />, label: "Personal profile" },
  { icon: <EmailIcon />, label: "Message center" },
  { icon: <ShieldIcon />, label: "Login and security" },
  { icon: <LockIcon />, label: "Data and privacy" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user]);

  const handleBack = () => navigate("/home");

  return (
    <Box
      sx={{
        maxWidth: 480,
        margin: "auto",
        bgcolor: "#F9F9F9",
        minHeight: "100vh",
        marginBottom: "56px",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 180,
          bgcolor: "#2A7C76",
          padding: 2,
          borderRadius: "0 0 32px 32px",
        }}
      >
        <IconButton onClick={handleBack} sx={{ color: "white" }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" color="white" fontWeight={600}>
          Profile
        </Typography>
        <IconButton sx={{ color: "white" }}>
          <NotificationsNoneIcon />
        </IconButton>
      </Box>

      {/* Avatar Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          mt: "-64px",
          mb: 4,
        }}
      >
        <Avatar
          src="/your-image-url.png"
          alt="Rakesh"
          sx={{
            width: 96,
            height: 96,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "4px solid white",
          }}
        />
        <Typography variant="h6" color="text.primary" fontWeight={600} mt={1}>
          {user?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>

      {/* Menu Section */}
      <Box sx={{ px: 3 }}>
        {menuItems.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              paddingY: 2,
              borderBottom:
                index !== menuItems.length - 1 ? "1px solid #E0E0E0" : "none",
            }}
          >
            {item.icon}
            <Typography variant="body1" color="text.primary">
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
