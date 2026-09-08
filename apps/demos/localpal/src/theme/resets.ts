import type { CSSProperties } from "react";

/** Cap-trimmed text (Figma measures type cap-to-cap). Chromium 133+. */
export const capTrim = {
  textBoxTrim: "trim-both",
  textBoxEdge: "cap text",
} as CSSProperties;

/** A button that is only its content. */
export const buttonReset: CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

/** The same, for buttons whose content is a left-aligned text row. */
export const textButtonReset: CSSProperties = {
  ...buttonReset,
  textAlign: "left",
};

export const inputReset: CSSProperties = {
  background: "transparent",
  border: "none",
  outline: "none",
  padding: 0,
  margin: 0,
  fontFamily: "inherit",
};
