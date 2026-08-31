import { formatRupiah } from "@/lib/store";

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  color?: string;
}

export default function BarChart({ data, color = "var(--green-mid)" }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((point, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--ink-muted)", width: 30, flexShrink: 0, textAlign: "right" }}>
            {point.label}
          </span>
          <div style={{ flex: 1, height: 22, background: "var(--cream-dark)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(point.value / max) * 100}%`,
              background: color,
              borderRadius: 6,
              minWidth: point.value > 0 ? 4 : 0,
              transition: "width 0.4s ease",
              display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6,
            }}>
              {point.value > 0 && (
                <span style={{ fontSize: 10, color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {formatRupiah(point.value)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
