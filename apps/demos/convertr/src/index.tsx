import { render } from "solid-js/web";
import { announceReady, holdWhileHidden } from "@portfolio/demo-protocol";
import App from "./App";
import "./styles/global.css";

// Embedded in the portfolio: hold still while scrolled out of sight.
holdWhileHidden();

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
  // Tell the portfolio's DemoShell we've painted (no-op outside an iframe).
  requestAnimationFrame(() => announceReady("convertr"));
}
