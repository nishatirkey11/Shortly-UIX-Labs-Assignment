import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import LinkDetail from "./pages/LinkDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/links/:id"
          element={<LinkDetail />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;