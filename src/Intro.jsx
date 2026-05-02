import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { INTRO_NAVIGATE_TARGET } from "./paths.js";

const Intro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const LOADING_TIME = 700; // 2s

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem("introPlayed", "true");
      navigate(INTRO_NAVIGATE_TARGET);
    }, LOADING_TIME);

    return () => clearTimeout(timer);
  }, []);

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
      {loading && <span style={{ fontSize: "20px" }}>Loading...</span>}
    </div>
  );
};

export default Intro;