import { announceReady } from "@portfolio/demo-protocol";

// Minimal interactive demo proving the embed pipeline end-to-end:
// static Vite build → /demos/sample/ → iframe in DemoShell → ready handshake.

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div style="font-family: system-ui; display: grid; place-items: center; min-height: 100vh; gap: 12px;">
    <p>sample demo</p>
    <button id="counter" type="button" style="font-size: 1.25rem; padding: 8px 20px; cursor: pointer;"></button>
  </div>
`;

const button = document.querySelector<HTMLButtonElement>("#counter")!;
let count = 0;

function render() {
  button.textContent = `count is ${count}`;
}

button.addEventListener("click", () => {
  count += 1;
  render();
});

render();
announceReady("sample");
