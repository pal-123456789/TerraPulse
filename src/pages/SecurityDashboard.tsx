import { Navigate } from "react-router-dom";

// Security has moved into Settings → Security tab.
const SecurityDashboard = () => <Navigate to="/settings" replace />;

export default SecurityDashboard;
