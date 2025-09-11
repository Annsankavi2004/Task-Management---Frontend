// src/context/UserContext.jsx
import { createContext, useContext, useState } from "react";

// ✅ Create context
const UserContext = createContext();

// ✅ Provider component
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

// ✅ Custom hook
export function useUser() {
  return useContext(UserContext);
}
