import { Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import Welcome from "./pages/Welcome";
import { Register } from "./pages/Register";
import GroupChat from "./pages/GroupChat";
import { PrivateRoute } from "./routes/privateRoute";

export function App() {
  return (
   
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={(
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          )}
        />
        <Route path="/register" element={<Register/>} />
        <Route
          path="/groups/:id/chat"
          element={(
            <PrivateRoute>
              <GroupChat />
            </PrivateRoute>
          )}
        />
      </Routes>
    
  );
}
