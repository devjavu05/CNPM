import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import ReaderLayout from "./components/ReaderLayout";
import WorkspaceLayout from "./components/WorkspaceLayout";
import AccessGate from "./components/AccessGate";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CatalogPage from "./pages/CatalogPage";
import StaffCreateBookPage from "./pages/StaffCreateBookPage";
import StaffViewBookPage from "./pages/StaffViewBookPage";
import StaffEditBookPage from "./pages/StaffEditBookPage";
import StaffAddCopiesPage from "./pages/StaffAddCopiesPage";
import ReservationsPage from "./pages/ReservationsPage";
import CirculationPage from "./pages/CirculationPage";
import FinesPage from "./pages/FinesPage";
import StaffPage from "./pages/StaffPage";
import AdminPage from "./pages/AdminPage";
import ReaderCatalogPage from "./pages/ReaderCatalogPage";
import ReaderBookDetailPage from "./pages/ReaderBookDetailPage";
import BorrowHistoryPage from "./pages/BorrowHistoryPage";
import NotificationsPage from "./pages/NotificationsPage";
import RootRedirectPage from "./pages/RootRedirectPage";
import PublicBookDetailPage from "./pages/PublicBookDetailPage";
import ReaderBalancePage from "./pages/ReaderBalancePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirectPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/welcome" element={<HomePage />} />
        <Route path="/search/:id" element={<PublicBookDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<AccessGate mode="reader" />}>
        <Route path="/reader" element={<ReaderLayout />}>
          <Route index element={<Navigate to="books" replace />} />
          <Route path="books" element={<ReaderCatalogPage />} />
          <Route path="books/:id" element={<ReaderBookDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="history" element={<BorrowHistoryPage />} />
          <Route path="balance" element={<ReaderBalancePage />} />
          <Route path="reservations" element={<ReservationsPage />} />
        </Route>
      </Route>

      <Route element={<AccessGate mode="staff" />}>
        <Route path="/workspace" element={<WorkspaceLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="lookup"
            element={<Navigate to="/workspace/catalog" replace />}
          />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/new" element={<StaffCreateBookPage />} />
          <Route path="catalog/:id" element={<StaffViewBookPage />} />
          <Route path="catalog/:id/edit" element={<StaffEditBookPage />} />
          <Route
            path="catalog/:id/add-copies"
            element={<StaffAddCopiesPage />}
          />
          <Route path="circulation" element={<CirculationPage />} />
          <Route path="fines" element={<FinesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route
            path="reservations"
            element={<Navigate to="/workspace/circulation" replace />}
          />
        </Route>
      </Route>

      <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
      <Route
        path="/catalog"
        element={<Navigate to="/workspace/catalog" replace />}
      />
      <Route
        path="/reservations"
        element={<Navigate to="/reader/reservations" replace />}
      />
      <Route
        path="/circulation"
        element={<Navigate to="/workspace/circulation" replace />}
      />
      <Route
        path="/fines"
        element={<Navigate to="/workspace/fines" replace />}
      />
      <Route
        path="/staff"
        element={<Navigate to="/workspace/staff" replace />}
      />
      <Route
        path="/admin"
        element={<Navigate to="/workspace/admin" replace />}
      />
      <Route
        path="/books"
        element={<Navigate to="/workspace/catalog" replace />}
      />
    </Routes>
  );
}
