import type { ReactNode } from "react";

export type DeviceVariant = "phone" | "desktop";

/**
 * Structural stub for the device chrome around embedded demos. Styling comes
 * later — for now it only fixes the aspect ratio per variant so DemoShell has
 * a stable box to fill.
 */
export function DeviceFrame({
  variant,
  children,
}: {
  variant: DeviceVariant;
  children: ReactNode;
}) {
  return (
    <div
      data-device-frame={variant}
      className={
        variant === "phone"
          ? "relative mx-auto aspect-[390/844] w-full max-w-[390px] overflow-hidden rounded-[2.5rem] border"
          : "relative mx-auto aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-xl border"
      }
    >
      {children}
    </div>
  );
}
