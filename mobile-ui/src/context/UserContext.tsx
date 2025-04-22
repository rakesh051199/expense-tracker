import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  categories: any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("userInfo");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [categories, setCategories] = useState({ income: [], expense: [] });

  const checkSession = async () => {
    try {
      await axios.get(
        "https://6m1sem7dp0.execute-api.us-west-2.amazonaws.com/prod/session",
        { withCredentials: true }, // Ensure cookies are sent for session validation
      );
    } catch (error) {
      console.error("Failed to fetch session:", error);
      logout(); // Stop polling if session check fails
    }
  };

  const logout = () => {
    console.log("coming to logout block");
    localStorage.removeItem("userInfo");
    setUser(null);
  };

  useEffect(() => {
    console.log("user from context 1st block", user);
    if (!user) return;

    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "https://my-money-app-categories-bucket.s3.us-west-2.amazonaws.com/categories.json",
        );
        setCategories(response.data);
        console.log("response from s3", response);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log("user from context 1st block", user);
    if (user) {
      localStorage.setItem("userInfo", JSON.stringify(user));
    } else {
      console.log("coming to else block");
      localStorage.removeItem("userInfo");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, logout, categories }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;
