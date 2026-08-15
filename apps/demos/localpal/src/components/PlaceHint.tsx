import { Squircle } from "./Squircle";
import { useSquircle } from "./SquircleProvider";
import { color, font } from "../theme/tokens";

/**
 * Far-tier place marker — the one thing the map shows for a whole city when
 * the zoom-tier curation hides its pins: the place's crest (Comunidad de
 * Madrid's seven white stars) on a brand squircle, a count badge with how
 * much is going on, and a cartographic name label below. Tapping it dives
 * into the action (handled by the parent marker).
 *
 * Built as a reusable unit so more places can join later — pass their name,
 * count and (eventually) crest.
 */

const TILE = 40;
const BADGE = 19;

/** The seven stars of the Comunidad de Madrid flag, extracted from the brand
 *  SVG (background square dropped — the `<Squircle>` container replaces it,
 *  registry-driven like every other tile). */
function MadridStars({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 141 141"
      fill="none"
      aria-hidden
    >
      <path
        d="M55.8926 47.6416C55.9813 47.7059 56.0875 47.7833 56.2118 47.8736C56.8108 50.41 58.0129 53.6695 58.5744 56.1313C61.6688 56.0151 64.9265 56.0817 68.0186 56.1753L60.3439 61.7458C61.5108 64.7507 62.3102 67.9343 63.4496 70.7358C62.6204 70.0117 56.5471 65.5159 55.7897 65.3496C53.2182 66.995 50.9495 68.875 48.437 70.5189C48.9545 67.7897 50.4214 64.7589 51.0354 61.7262C48.4069 59.9476 45.8308 58.0921 43.3109 56.1624C46.5116 56.2703 49.7149 56.2761 52.9159 56.1796C53.8058 53.2939 54.6475 50.3944 55.8926 47.6416Z"
        fill="#FEFEFE"
      />
      <path
        d="M41.3075 67.4971C41.7565 67.9577 43.7614 75.07 43.9502 76.1012C47.0838 76.0665 50.2179 76.0645 53.3517 76.0956C50.9711 78.09 48.1888 79.7507 45.986 81.7357C46.9216 84.6955 47.7715 87.6368 48.7377 90.6058C47.9572 89.8808 41.9312 85.4671 41.1716 85.31C38.9561 86.7085 35.9865 88.9574 33.8161 90.4986C34.6345 87.6336 35.6069 84.6619 36.4945 81.8065C33.965 79.9662 31.32 78.1421 28.9427 76.1266C31.8929 76.2905 35.247 76.2402 38.2318 76.2485C39.2034 73.798 40.238 69.4606 41.3075 67.4971Z"
        fill="#FEFEFE"
      />
      <path
        d="M26.7895 47.6211C26.8863 47.6814 27.002 47.7535 27.1362 47.8372C27.8624 50.2449 29.0474 53.7867 29.7428 56.0679C32.614 56.0556 36.211 55.9942 39.0162 56.2412C36.8204 57.6368 33.6822 60.0996 31.5152 61.6881C32.3039 64.4775 33.5369 67.7214 34.4433 70.5952C32.2578 68.9397 28.6807 66.7212 26.8763 65.1229C26.3141 65.7668 20.3341 69.9978 19.3856 70.6882C20.1285 67.8497 21.3344 64.6381 22.2219 61.7386C19.6661 60.1367 16.9375 58.0553 14.5596 56.2074C17.6468 56.247 20.7345 56.2539 23.8218 56.2285C24.9551 53.4111 25.9456 50.5382 26.7895 47.6211Z"
        fill="#FEFEFE"
      />
      <path
        d="M84.5401 47.8359C85.4162 48.4582 87.2749 54.8091 87.6333 56.1275C90.7321 56.0701 93.8317 56.0693 96.9307 56.1253C94.4246 58.0349 91.896 59.9143 89.345 61.7636C90.4639 64.7038 91.3347 67.6471 92.3559 70.6188C90.1989 68.867 87.1107 66.9305 84.7768 65.2649C84.6046 65.2725 78.0659 70.0671 77.337 70.5423C78.1042 67.6155 79.272 64.8039 80.0387 61.7329C77.9538 60.0845 74.6821 57.955 72.3731 56.2477C75.0349 56.1574 79.5068 56.4619 81.9715 56.0937C82.6656 53.5287 83.7287 50.4198 84.5401 47.8359Z"
        fill="#FEFEFE"
      />
      <path
        d="M99.0488 67.4824C99.7583 68.1329 101.602 74.7749 102.022 76.1114C105.16 76.0855 108.298 76.076 111.435 76.0835C109.221 77.5608 106.052 80.0779 103.788 81.7438C104.628 83.4701 106.004 88.2111 106.963 90.5079L99.3033 85.3284C98.7929 85.3947 92.7435 89.8389 91.7213 90.5415C92.8026 87.757 93.4863 84.7172 94.587 81.8853C92.5074 80.3077 88.6392 77.7755 86.916 76.1338C90.0394 76.2431 93.1655 76.2671 96.2904 76.2059L99.0488 67.4824Z"
        fill="#FEFEFE"
      />
      <path
        d="M113.588 47.6699C114.399 48.283 116.176 54.8282 116.538 56.0815C119.629 56.075 122.756 56.0374 125.84 56.1856C123.365 58.099 120.834 59.9396 118.25 61.7047C119.095 63.3784 120.607 68.3911 121.263 70.4275C118.877 68.9046 115.957 66.8196 113.704 65.098C112.707 66.1624 107.806 69.5607 106.358 70.6026C107.285 67.6873 108.18 64.7618 109.043 61.8268C106.515 59.7808 104.177 58.5013 101.466 56.1787C104.41 56.0864 107.898 56.2708 111.007 56.2245C111.58 53.7291 112.794 50.196 113.588 47.6699Z"
        fill="#FEFEFE"
      />
      <path
        d="M70.091 67.6289C70.8439 68.2036 72.6205 74.8197 73.0463 76.2321C75.5326 75.948 79.7909 76.0808 82.3147 76.1079C79.8872 77.9908 77.263 79.849 74.7864 81.689C75.7907 84.0865 76.7259 87.7683 77.6937 90.4693C75.8573 88.9621 72.465 86.8143 70.3551 85.3143C68.0286 86.5575 65.1772 88.9586 62.5789 90.4639C63.5119 88.438 64.754 84.2358 65.6346 81.8357C64.1052 80.9733 59.0585 77.1954 57.7955 76.0485C60.7127 76.2922 64.4007 76.3159 67.3478 76.1796C68.1847 73.3052 69.0994 70.4538 70.091 67.6289Z"
        fill="#FEFEFE"
      />
    </svg>
  );
}

export function PlaceHint({ name, count }: { name?: string; count: number }) {
  const pinSq = useSquircle("pin");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      {/* Crest tile + count badge */}
      <div style={{ position: "relative", width: TILE, height: TILE }}>
        <Squircle
          radius={pinSq.radius}
          smoothing={pinSq.smoothing}
          fill={color.brand}
          style={{
            width: TILE,
            height: TILE,
            display: "grid",
            placeItems: "center",
            // Soft lift so the lone marker separates from the base map.
            boxShadow: "0 2px 10px rgba(20, 20, 43, 0.28)",
          }}
        >
          <MadridStars size={TILE} />
        </Squircle>
        <div
          style={{
            position: "absolute",
            top: -BADGE * 0.35,
            right: -BADGE * 0.35,
            minWidth: BADGE,
            height: BADGE,
            boxSizing: "border-box",
            padding: "0 5px",
            borderRadius: BADGE / 2,
            background: color.brand,
            color: color.onBrand,
            display: "grid",
            placeItems: "center",
            fontFamily: font.family,
            fontSize: BADGE * 0.55,
            lineHeight: 1,
            fontWeight: 500,
            // White ring so the badge reads over the crest tile.
            boxShadow: "0 0 0 2px #fff",
          }}
        >
          {count}
        </div>
      </div>
      {/* Cartographic name label — reads like the base map's own typography.
          Omitted when the crest rides the base map's own place label (Madrid),
          which then acts as the caption. */}
      {name && (
        <span
          style={{
            fontFamily: font.family,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.2,
            color: "#3b3e46",
            // Halo like real map labels, so it stays legible over streets.
            textShadow: "0 0 3px #fff, 0 0 3px #fff, 0 0 4px #fff",
            userSelect: "none",
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
