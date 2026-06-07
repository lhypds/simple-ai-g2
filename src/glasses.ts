// Glasses display: one full-screen text container that mirrors the web terminal —
// it prints the most recent tail of the same sc output stream, with a status line
// pinned to the bottom. createStartUpPageContainer may only be called once, so this
// sets it up and then pushes every later update through textContainerUpgrade.

import {
  CreateStartUpPageContainer,
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
} from "@evenrealities/even_hub_sdk";

const CONTAINER_ID = 1;
const CONTAINER_NAME = "caption"; // max 16 chars
const SCREEN_WIDTH = 576;
const SCREEN_HEIGHT = 288;

// The container captures scroll events (isEventCapture), so when idle we hand it a
// large window of recent output to scroll through. Capped to stay within the source
// buffer (see TERMINAL_MAX in main.ts).
const MAX_TERMINAL_LINES = 200;
const MAX_TERMINAL_CHARS = 3800;

// While text is streaming we instead show just the lines that fit on screen, so the
// newest output stays pinned to the bottom (the device renders content top-down).
const FOLLOW_LINES = 7;
const FOLLOW_CHARS = 240;

export interface Display {
  // `follow` keeps the newest text on screen (used while generating); otherwise the
  // full scrollable window is shown.
  render(state: { status: string; text: string; follow?: boolean }): Promise<void>;
}

export async function createDisplay(bridge: EvenAppBridge): Promise<Display> {
  const main = new TextContainerProperty({
    xPosition: 0,
    yPosition: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    borderWidth: 0,
    borderColor: 5,
    paddingLength: 4,
    containerID: CONTAINER_ID,
    containerName: CONTAINER_NAME,
    content: "Starting…",
    isEventCapture: 1,
  });

  const result = await bridge.createStartUpPageContainer(
    new CreateStartUpPageContainer({ containerTotalNum: 1, textObject: [main] }),
  );
  if (result !== 0) throw new Error(`createStartUpPageContainer failed: ${result}`);

  return {
    async render({ status, text, follow }) {
      // The newest lines (auto-scrolled to the bottom), with the status pinned below.
      const lines: string[] = [];
      const maxLines = follow ? FOLLOW_LINES : MAX_TERMINAL_LINES;
      const maxChars = follow ? FOLLOW_CHARS : MAX_TERMINAL_CHARS;
      const tail = tailWindow(text, maxLines, maxChars);
      if (tail) lines.push(tail);
      if (status) lines.push(status);
      const content = lines.join("\n");
      await bridge.textContainerUpgrade(
        new TextContainerUpgrade({
          containerID: CONTAINER_ID,
          containerName: CONTAINER_NAME,
          contentOffset: 0,
          contentLength: content.length,
          content,
        }),
      );
    },
  };
}

// Keep the most recent `maxLines` lines, then trim the head to `maxChars` (at a word
// boundary) so the newest text always lands at the bottom of the screen.
function tailWindow(text: string, maxLines: number, maxChars: number): string {
  let window = text.split("\n").slice(-maxLines).join("\n");
  if (window.length > maxChars) {
    const cut = window.slice(window.length - maxChars);
    const space = cut.indexOf(" ");
    window = space > 0 ? cut.slice(space + 1) : cut;
  }
  return window;
}
