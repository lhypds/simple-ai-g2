// Web-side UI rendered into #app:
//   - a header with a settings (gear) icon
//   - a settings modal to set/save username + password
//   - a transcript panel that shows each finished transcription result
//
// Glasses rendering is unchanged; this is the page the user sees in the app/browser.

import "./ui.css";
import type { EvenAppBridge } from "@evenrealities/even_hub_sdk";
import { loadSettings, saveSettings } from "./settings";

const GEAR_SVG = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
</svg>`;

export interface WebUI {
  setStatus(text: string): void;
  addTranscript(text: string): void;
}

export async function createWebUI(bridge: EvenAppBridge): Promise<WebUI> {
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) throw new Error("#app element not found");

  root.innerHTML = `
    <div class="app">
      <header class="app__header">
        <div class="app__title">
          simple ai
          <span class="app__status" data-status></span>
        </div>
        <button class="icon-btn" data-open-settings aria-label="Settings">${GEAR_SVG}</button>
      </header>
      <main class="transcript" data-transcript>
        <p class="transcript__empty">Speak — finished transcripts will appear here.</p>
      </main>
    </div>

    <div class="modal" data-modal>
      <div class="modal__box">
        <h2 class="modal__title">Settings</h2>
        <label class="field">
          <span class="field__label">Username</span>
          <input class="field__input" data-username type="text" autocomplete="username" />
        </label>
        <label class="field">
          <span class="field__label">Password</span>
          <input class="field__input" data-password type="password" autocomplete="current-password" />
        </label>
        <div class="modal__actions">
          <span class="modal__saved" data-saved>Saved ✓</span>
          <button class="btn" data-close-settings>Cancel</button>
          <button class="btn btn--primary" data-save>Save</button>
        </div>
      </div>
    </div>
  `;

  const statusEl = root.querySelector<HTMLSpanElement>("[data-status]")!;
  const listEl = root.querySelector<HTMLElement>("[data-transcript]")!;
  const modal = document.querySelector<HTMLDivElement>("[data-modal]")!;
  const usernameInput = modal.querySelector<HTMLInputElement>("[data-username]")!;
  const passwordInput = modal.querySelector<HTMLInputElement>("[data-password]")!;
  const savedNote = modal.querySelector<HTMLSpanElement>("[data-saved]")!;

  const openModal = async () => {
    const settings = await loadSettings(bridge);
    usernameInput.value = settings.username;
    passwordInput.value = settings.password;
    savedNote.classList.remove("modal__saved--show");
    modal.classList.add("modal--open");
  };
  const closeModal = () => modal.classList.remove("modal--open");

  root.querySelector("[data-open-settings]")!.addEventListener("click", () => void openModal());
  modal.querySelector("[data-close-settings]")!.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector("[data-save]")!.addEventListener("click", async () => {
    await saveSettings(bridge, {
      username: usernameInput.value.trim(),
      password: passwordInput.value,
    });
    savedNote.classList.add("modal__saved--show");
    setTimeout(closeModal, 600);
  });

  return {
    setStatus(text: string) {
      statusEl.textContent = text;
    },
    addTranscript(text: string) {
      const empty = listEl.querySelector(".transcript__empty");
      if (empty) empty.remove();

      const line = document.createElement("div");
      line.className = "line";
      const time = document.createElement("span");
      time.className = "line__time";
      time.textContent = new Date().toLocaleTimeString();
      const body = document.createElement("span");
      body.className = "line__text";
      body.textContent = text;
      line.append(time, body);
      listEl.append(line);
      listEl.scrollTop = listEl.scrollHeight;
    },
  };
}
