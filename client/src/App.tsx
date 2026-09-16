import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/public/Home";

import RegulatorLogin from "./pages/RegulatorLogin";
import RegulatorDashboard from "./pages/RegulatorDashboard";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import EmployeeLogin from "./pages/EmployeeLogin";

import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerSignup from "./pages/auth/CustomerSignup";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC WEBSITE */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* REGULATOR */}

        <Route
          path="/regulator/login"
          element={<RegulatorLogin />}
        />

        <Route
          path="/regulator/dashboard"
          element={<RegulatorDashboard />}
        />

        {/* ADMIN */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        {/* EMPLOYEE */}

        <Route
          path="/employee/login"
          element={<EmployeeLogin />}
        />

        {/* CUSTOMER */}

        <Route
          path="/user/login"
          element={<CustomerLogin />}
        />

        <Route
          path="/user/signup"
          element={<CustomerSignup />}
        />

        <Route
          path="/user/dashboard"
          element={<CustomerDashboard />}
        />

        <Route
          path="/employee/dashboard"
          element={<EmployeeDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;