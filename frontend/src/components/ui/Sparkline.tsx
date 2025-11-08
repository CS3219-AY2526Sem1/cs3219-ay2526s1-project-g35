type Props = {
  title: string;
  data: number[];
  colorClass?: string; // e.g., text-primary stroke-current
  className?: string;
};

/**
 * Lightweight SVG line chart with minimal axes.
 * No external dependencies.
 */
export function Sparkline({ title, data, colorClass = 'text-primary', className }: Props) {
  const width = 420;
  const height = 240;
  const padding = 28;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);

  const x = (i: number) => padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1);
  const y = (v: number) => height - padding - ((v - min) * (height - padding * 2)) / range;

  const path = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(' ');

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="rounded-xl border bg-card shadow-sm">
        <svg width={width} height={height} className="block">
          {/* axes */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            className="stroke-muted"
            strokeWidth={1}
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            className="stroke-muted"
            strokeWidth={1}
          />
          {/* line */}
          <path d={path} className={`${colorClass} stroke-[2] fill-none`} />
          {/* circles */}
          {data.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={3} className={`${colorClass} fill-current`} />
          ))}
        </svg>
      </div>
    </div>
  );
}
