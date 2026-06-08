// Glasses display: one full-screen text container that mirrors the web terminal.
// We push the entire output buffer as the container's content so the device shows a
// native scroll bar and the user can scroll through it with the glasses controls.
// A status line (e.g. "● listening") is appended at the end so it sits at the bottom.
//
// NOTE: this intentionally uses a SINGLE container. A previous attempt to pin the
// status to the bottom-right via a second container worked in the simulator but left
// the real glasses blank — the firmware rejects the 2-container startup page, and
// since createStartUpPageContainer may only be called once there's no fallback. Keep
// it to one container.

import {
  CreateStartUpPageContainer,
  TextContainerProperty,
  TextContainerUpgrade,
  type EvenAppBridge,
} from "@evenrealities/even_hub_sdk";
import { tailRows } from "../utils/textUtils";

const CONTAINER_ID = 1;
const CONTAINER_NAME = "caption"; // max 16 chars
const SCREEN_WIDTH = 576;
const SCREEN_HEIGHT = 288;

// A big rounded border framing the whole view. The container is inset by the
// border width on every side so the stroke stays fully on-screen, and padding
// is widened so text never touches the border.
const BORDER_WIDTH = 1;
const BORDER_RADIUS = 28;
const BORDER_COLOR = 5;
const PADDING = 12;

// We can't command the device's native scroll, so we only ever send the tail that
// fits one screen (see `tailRows`); if we send more, the content overflows the usable
// area and the firmware draws a scroll bar. The usable height is the screen minus the
// border AND the top+bottom padding (288 - 2 - 2*PADDING ≈ 262px), so these counts
// must stay conservative — overshooting by even one row brings the scroll bar back.
// Rough estimates of the default font; tune against the glasses.
const CHARS_PER_LINE = 48; // how many chars fit on one wrapped row
const SCREEN_ROWS = 9; // how many wrapped rows fit vertically (kept low to avoid overflow)

export interface Display {
  // Always renders the last screenful so the bottom stays visible — the device's
  // scroll can't be driven programmatically, and trimming avoids a scroll bar.
  render(state: { status: string; text: string }): Promise<void>;
}

export async function createDisplay(bridge: EvenAppBridge): Promise<Display> {
  const main = new TextContainerProperty({
    xPosition: BORDER_WIDTH,
    yPosition: BORDER_WIDTH,
    width: SCREEN_WIDTH - BORDER_WIDTH * 2,
    height: SCREEN_HEIGHT - BORDER_WIDTH * 2,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_COLOR,
    borderRadius: BORDER_RADIUS,
    paddingLength: PADDING,
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
    async render({ status, text }) {
      // Send the whole buffer as the content; the device scrolls it natively. Trim
      // trailing newlines off the body so the status doesn't get pushed down by a
      // dangling blank line.
      let body = text.replace(/\n+$/, "");
      // Always keep only the last screenful so the content never overflows the
      // container — that's what makes the device draw a scroll bar. Trimming on
      // every render (not just while generating) keeps the newest text in view and
      // the scroll bar gone. Reserve a row for the status line appended below.
      body = tailRows(body, SCREEN_ROWS - (status ? 1 : 0), CHARS_PER_LINE);
      const content = status ? (body ? `${body}\n${status}` : status) : body;
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
