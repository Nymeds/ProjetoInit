import { useContext } from "react";
import { RegisterContext } from "../context/RegisterContext";

export function useRegister() {
  const context = useContext(RegisterContext);
  if (!context) {
    throw new Error("useRegister must be used within RegisterProvider");
  }
  return context;
}
