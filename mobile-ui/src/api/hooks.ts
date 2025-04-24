import { useQuery } from "@tanstack/react-query";
import axios from "axios";

function useTransactions(userId: string, selectedMonth: any) {
  const response = useQuery({
    queryKey: ["transactions", userId, selectedMonth],
    queryFn: async () => {
      const response = await axios.get(
        `https://6m1sem7dp0.execute-api.us-west-2.amazonaws.com/prod/transactions?userId=${userId}&year=${selectedMonth.year}&month=${selectedMonth.month}`,
        {
          withCredentials: true,
          headers: {
            "x-api-key": "Fh22o86IuZqSCI0YmaQB3H9lb0Wpt7V66DFOZGj1",
          },
        },
      );
      return response.data;
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5,
  });
  return response;
}
function useBudgets(userId: string, selectedMonth: any) {
  const response = useQuery({
    queryKey: ["budgets", userId, selectedMonth],
    queryFn: async () => {
      const response = await axios.get(
        `https://6m1sem7dp0.execute-api.us-west-2.amazonaws.com/prod/budgets?userId=${userId}&year=${selectedMonth.year}&month=${selectedMonth.month}`,
        { withCredentials: true },
      );
      return response.data;
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5,
  });
  return response;
}

export { useTransactions, useBudgets };
