"use client";

import React, { createContext, useContext, useState } from "react";
import type { UserInventoryRole } from "../types/inventory.types";

interface InventoryRoleContextType {
  role: UserInventoryRole;
  setRole: (role: UserInventoryRole) => void;
  isManager: boolean;
}

const InventoryRoleContext = createContext<InventoryRoleContextType>({
  role: "SALES_REP",
  setRole: () => {},
  isManager: false,
});

export const InventoryRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserInventoryRole>("SALES_REP");

  return (
    <InventoryRoleContext.Provider
      value={{
        role,
        setRole,
        isManager: role === "MANAGER",
      }}
    >
      {children}
    </InventoryRoleContext.Provider>
  );
};

export function useInventoryRole() {
  return useContext(InventoryRoleContext);
}
