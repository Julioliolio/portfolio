import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type Ref,
} from 'react';
import { getSvgPath } from 'figma-squircle';
import { smoothing as defaultSmoothing } from '../theme/tokens';
import { useSquircleContext } from './SquircleProvider';
import type { SquircleRole } from '../theme/squircles';

// Extends an index signature (rather than intersecting one) so the named
// members keep their declared types when destructured — the intersection
// form collapses them to `{}` under TS 6's stricter destructuring.
interface SquircleProps extends Record<string, unknown> {
  /** Registry role — pulls radius/smoothing from the live squircle registry. */
  role?: SquircleRole;
  /** Corner radius in px. Overrides the role if set. */
  radius?: number;
  /** Figma corner-smoothing, 0..1. iOS ≈ 0.6. Overrides the role if set. */
  smoothing?: number;
  /** Fill color. If set, painted behind children via the clip path. */
  fill?: string;
  /** Optional 1px-ish outline that follows the squircle exactly. */
  stroke?: string;
  strokeWidth?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** React 19 ref-as-prop (no forwardRef needed). */
  ref?: Ref<HTMLElement>;
}

/**
 * A true iOS/Figma squircle (superellipse), not a rounded rect.
 *
 * Measures its own box, generates the exact superellipse path with
 * figma-squircle, then clips content to it. An optional SVG overlay draws
 * a stroke that hugs the same curve (clip-path can't render borders).
 */
export function Squircle({
  role,
  radius,
  smoothing,
  fill,
  stroke,
  strokeWidth = 1.5,
  as: Tag = 'div',
  className,
  style,
  children,
  ref: _ref,
  ...rest
}: SquircleProps) {
  const { styles } = useSquircleContext();
  const roleStyle = role ? styles[role] : undefined;
  const resolvedRadius = radius ?? roleStyle?.radius ?? 18;
  const resolvedSmoothing = smoothing ?? roleStyle?.smoothing ?? defaultSmoothing;

  const innerRef = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () =>
      setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const path =
    size.w > 0 && size.h > 0
      ? getSvgPath({
          width: size.w,
          height: size.h,
          cornerRadius: resolvedRadius,
          cornerSmoothing: resolvedSmoothing,
        })
      : '';

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        innerRef.current = node;
        if (typeof _ref === 'function') _ref(node);
        else if (_ref) (_ref as { current: HTMLElement | null }).current = node;
      }}
      className={className}
      style={{
        position: 'relative',
        backgroundColor: fill,
        clipPath: path ? `path('${path}')` : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
      {stroke && path && (
        <svg
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
          aria-hidden
        >
          <path
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      )}
    </Tag>
  );
}
