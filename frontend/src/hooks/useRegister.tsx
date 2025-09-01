import { useContext } from "react";
import { RegisterContext } from "../context/RegisterContext";

export function useRegister() {
  return useContext(RegisterContext);
}
