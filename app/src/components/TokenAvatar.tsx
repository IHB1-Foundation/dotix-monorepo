"use client";

const AVATAR_COLORS: [string, string][] = [
  ["#0f7ad8", "#ddf4ff"],
  ["#20c997", "#d1fdf3"],
  ["#f59f00", "#fff8e1"],
  ["#f97316", "#ffede0"],
  ["#a855f7", "#f3e8ff"],
  ["#ef4444", "#ffe4e4"],
];

function colorForAddress(address: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

type Props = {
  symbol?: string;
  address: string;
  size?: number;
  color?: string;
};

export function TokenAvatar({ symbol, address, size = 32, color }: Props) {
  const [bg, fg] = color
    ? [color, "#ffffff"]
    : colorForAddress(address);

  const letter = (symbol ?? address).slice(0, 1).toUpperCase();
  const fontSize = Math.round(size * 0.42);

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: fg,
        color: bg,
        fontSize,
        border: `2px solid ${bg}22`,
      }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
