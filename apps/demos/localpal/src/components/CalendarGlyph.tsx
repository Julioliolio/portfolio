/**
 * Calendar glyph — vector rebuild of the Figma calendar icon (node 1423:1061),
 * replacing the old baked `calendar-glyph.png` so it stays crisp at any zoom.
 * Color follows `currentColor` (defaults to the white it sits at on the brand
 * button); pass `color` to override.
 */
export default function CalendarGlyph({
  width = 27,
  height = 33,
  color = '#FEFEFE',
  ...rest
}: { width?: number; height?: number; color?: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 28 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {/* checkmark */}
      <path
        d="M11.5823 27.1998V27.2119H14.7337L20.0522 20.7823L17.589 18.894L13.217 24.1853H13.0832L10.5003 21.3307L8.40723 23.4128L11.5649 27.2119L11.5823 27.1998Z"
        fill={color}
      />
      {/* body + header divider */}
      <path
        d="M27.833 30.8975C27.8327 33.1064 26.042 34.8975 23.833 34.8975H4C1.79102 34.8975 0.000263864 33.1064 0 30.8975V3.52148H27.833V30.8975ZM4 30.8975H23.833V15.8271H4V30.8975ZM4 11.8271H23.833V7.52246H4V11.8271Z"
        fill={color}
      />
      {/* top tabs */}
      <path d="M22.6216 0V3.99818" stroke={color} strokeWidth={4} />
      <path d="M5.21045 0V3.99818" stroke={color} strokeWidth={4} />
    </svg>
  );
}
