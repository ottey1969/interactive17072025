import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/enhanced-chat.css";

const root = createRoot(document.getElementById("root")!);

// Use local authentication system
root.render(<App />);
