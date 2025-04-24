import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

interface MonthSelectorProps {
  months: { label: string }[];
  selectedMonthIndex: number;
  setSelectedMonthIndex: React.Dispatch<React.SetStateAction<number>>;
}

function MonthSelector({
  months,
  selectedMonthIndex,
  setSelectedMonthIndex,
}: MonthSelectorProps) {
  const handlePrevMonth = () => {
    setSelectedMonthIndex((prev) =>
      prev === months.length - 1 ? prev : prev + 1,
    );
  };

  const handleNextMonth = () => {
    setSelectedMonthIndex((prev) => (prev === 0 ? prev : prev - 1));
  };
  return (
    <Box display="flex" alignItems="center" justifyContent="center" my={3}>
      <IconButton
        onClick={handlePrevMonth}
        disabled={selectedMonthIndex === months.length - 1}
      >
        <ArrowBackIosIcon />
      </IconButton>
      <Typography variant="h6" fontWeight={600} mx={2}>
        {months[selectedMonthIndex].label}
      </Typography>
      <IconButton onClick={handleNextMonth} disabled={selectedMonthIndex === 0}>
        <ArrowForwardIosIcon />
      </IconButton>
    </Box>
  );
}

export default MonthSelector;
