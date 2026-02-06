import { Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import Welcome from "./pages/Welcome";
import { Register } from "./pages/Register";
import GroupChat from "./pages/GroupChat";

export function App() {
  return (
   
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register/>} />
        <Route path="/groups/:id/chat" element={<GroupChat/>} />
      </Routes>
    
  );
}
