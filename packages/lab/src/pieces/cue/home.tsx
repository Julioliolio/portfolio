"use client";

import { Suspense, lazy, useState, type ReactNode } from "react";
import { btn } from "../../bench";
import {
  GREETING_HELLO,
  GREETING_LINE,
  GreetingStyles,
  Speech,
  afterHello,
} from "../../greeting";
import { HelloStyles, useHelloTuning } from "../../hello";
import { useMotionTuning } from "../../motion";

/**
 * The home page's first screen, full size, for /lab/cue's Homepage view:
 * the greeting and the sign where the landing has them (the hello
 * tuning's), said in the landing's order, and the cue being tuned at
 * the screen's foot. `children` is handed the ms the cue should wait —
 * until the greeting's line is said, as on the landing.
 *
 * The sign is the real cartel with its plain entrance, as on /lab/hello.
 * The lab's background picker is hidden while it is up.
 */

const Cartel = lazy(() => import("../cartel"));

const CSS = `
.cue-home { position: absolute; inset: 0; min-height: 100vh; display: grid; place-items: center; overflow: hidden; background: #faf9f6; color: #171717; }
.cue-home-again { position: fixed; top: 56px; left: 16px; z-index: 95; }
/* The lab's page-background picker sits where the cue does; the home
   page has none, so it steps away while this view is up. */
div[aria-label="Page background"] { display: none; }
`;

export function HomeScreen({
  children,
}: {
  children: (cueDelay: number) => ReactNode;
}) {
  const hello = useHelloTuning();
  const motion = useMotionTuning();
  const [run, setRun] = useState(0);
  const lineAt = afterHello(motion);
  // The line's last word lands a few beats after it starts; the cue
  // follows it, as the landing's does once the greeting is said.
  const cueAt = lineAt + motion.stagger * 8;

  return (
    <div className="cue-home" key={run}>
      <style>{CSS}</style>
      <HelloStyles />
      <GreetingStyles />
      <button
        type="button"
        className="cue-home-again"
        style={btn}
        onClick={() => setRun((r) => r + 1)}
      >
        ▶ Say it again
      </button>
      <div className="hello-row">
        <Speech
          lines={GREETING_HELLO}
          base={motion.lead}
          step={motion.stagger}
          className="hello-words"
        />
        <div className="hello-sign">
          <Suspense fallback={null}>
            <Cartel
              height={`${hello.signHeight}vh`}
              controls={false}
              radius="page"
              placeholder={false}
            />
          </Suspense>
        </div>
        <div className="hello-line-slot">
          <Speech
            lines={GREETING_LINE}
            base={lineAt}
            step={motion.stagger}
            className="hello-words"
          />
        </div>
      </div>
      {children(cueAt)}
    </div>
  );
}
