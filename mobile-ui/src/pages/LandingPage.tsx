import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#EEF8F7",
        padding: "16px",
        marginBottom: "56px",
      }}
    >
      {/* Header Image */}
      <Box
        component="img"
        src="/images/app_logo.svg"
        alt="app-logo"
        sx={{
          width: "80%",
          maxWidth: "300px",
          mt: 4,
          objectFit: "contain",
        }}
      />

      {/* Title Section */}
      <Box sx={{ textAlign: "center" }}>
        <Typography
          variant="h4"
          color="#3F8782"
          fontWeight="bold"
          sx={{
            lineHeight: 1.4,
            fontSize: { xs: "28px", sm: "32px" },
          }}
        >
          Spend Smarter <br /> Save More
        </Typography>
      </Box>

      {/* Action Section */}
      <Box sx={{ width: "100%", textAlign: "center", mb: 4 }}>
        <Button
          onClick={() => navigate("/login")}
          variant="contained"
          sx={{
            borderRadius: "50px",
            backgroundColor: "#3F8782",
            padding: "12px 32px",
            fontSize: "18px",
            width: "80%",
            maxWidth: "320px",
            boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)",
          }}
        >
          Get Started
        </Button>

        <Typography variant="body2" sx={{ mt: 2, color: "#3F8782" }}>
          Already Have an Account?{" "}
          <Typography
            component="span"
            onClick={() => navigate("/login")}
            sx={{
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Log In
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
}
