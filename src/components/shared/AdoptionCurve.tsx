"use client";

import type { Respondent } from "@/lib/types";
import { SEGMENT_META, type Segment } from "@/lib/scoring";

// Real curve math (not decorative), per PRD §5's signature-visualization
// note — ported from prototype/App.jsx, restyled for the dark HUD palette.
const curvePoints = (x: number) => {
  const segments = [
    { start: 0, end: 0.08, h: 0.35 },
    { start: 0.08, end: 0.25, h: 0.65 },
    { start: 0.25, end: 0.62, h: 1.0 },
    { start: 0.62, end: 0.88, h: 1.0 },
    { start: 0.88, end: 1.0, h: 0.55 },
  ];
  for (const seg of segments) {
    if (x >= seg.start && x <= seg.end) {
      const t = (x - seg.start) / (seg.end - seg.start);
      return seg.h * Math.sin(t * Math.PI);
    }
  }
  return 0;
};

const SEGMENT_ORDER: Segment[] = ["laggard", "late_majority", "early_majority", "early_adopter", "innovator"];

export function AdoptionCurve({
  respondents,
  showPost = false,
  height = 280,
}: {
  respondents: Pick<Respondent, "id" | "preSegment" | "postSegment">[];
  showPost?: boolean;
  height?: number;
}) {
  const W = 600;
  const H = height;

  const pathD = () => {
    let d = `M 0 ${H * 0.85}`;
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const y = curvePoints(x);
      d += ` L ${x * W * 0.92 + W * 0.04} ${H * 0.85 - y * H * 0.65}`;
    }
    return d;
  };

  const segmentX = (seg: Segment) => (SEGMENT_META[seg].x / 100) * W * 0.92 + W * 0.04;
  const segmentY = (seg: Segment) => {
    const y = curvePoints(SEGMENT_META[seg].x / 100);
    return H * 0.85 - y * H * 0.65 - 16;
  };

  const dotsBySegment: Record<string, { id: string; isPost: boolean }[]> = {};
  respondents.forEach((r) => {
    const key = r.preSegment;
    if (!key) return;
    if (!dotsBySegment[key]) dotsBySegment[key] = [];
    dotsBySegment[key].push({ id: r.id, isPost: false });
    if (showPost && r.postSegment) {
      if (!dotsBySegment[r.postSegment]) dotsBySegment[r.postSegment] = [];
      dotsBySegment[r.postSegment].push({ id: r.id, isPost: true });
    }
  });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          {SEGMENT_ORDER.map((seg, i) => (
            <stop key={seg} offset={`${(i / (SEGMENT_ORDER.length - 1)) * 100}%`} stopColor={SEGMENT_META[seg].color} stopOpacity="0.15" />
          ))}
        </linearGradient>
      </defs>
      <path d={`${pathD()} L ${W * 0.96} ${H * 0.85} Z`} fill="url(#curveGrad)" />
      <path d={pathD()} fill="none" stroke="#3A4750" strokeWidth={2} />
      <line x1={W * 0.04} y1={H * 0.85} x2={W * 0.96} y2={H * 0.85} stroke="rgba(94,230,255,0.12)" strokeWidth={1} />
      {SEGMENT_ORDER.map((seg) => {
        const meta = SEGMENT_META[seg];
        const cx = segmentX(seg);
        const cy = segmentY(seg);
        const dots = dotsBySegment[seg] || [];
        return (
          <g key={seg}>
            <text x={cx} y={H * 0.93} textAnchor="middle" fontSize={10} fill={meta.color} fontWeight={600} fontFamily="'JetBrains Mono', monospace">
              {meta.label}
            </text>
            <text x={cx} y={H * 0.99} textAnchor="middle" fontSize={9} fill="#6E8790" fontFamily="'JetBrains Mono', monospace">
              {meta.pct}%
            </text>
            {dots.map((d, i) => {
              const row = Math.floor(i / 6);
              const inRow = dots.slice(row * 6, row * 6 + 6).length;
              const idxInRow = i % 6;
              const offset = (idxInRow - (Math.min(inRow, 6) - 1) / 2) * 14;
              return (
                <g key={`${d.id}-${d.isPost}`}>
                  <circle
                    cx={cx + offset}
                    cy={cy - row * 14}
                    r={5}
                    fill={d.isPost ? meta.color : "#07090B"}
                    stroke={meta.color}
                    strokeWidth={d.isPost ? 0 : 2}
                    opacity={d.isPost ? 0.9 : 1}
                  />
                  {d.isPost && (
                    <text x={cx + offset} y={cy - row * 14 + 3} textAnchor="middle" fontSize={7} fill="#07090B" fontFamily="'JetBrains Mono', monospace">
                      →
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      {showPost && (
        <g>
          <circle cx={W * 0.04} cy={H * 0.06} r={5} fill="#07090B" stroke="#9FB6BC" strokeWidth={2} />
          <text x={W * 0.04 + 10} y={H * 0.06 + 4} fontSize={10} fill="#9FB6BC" fontFamily="'JetBrains Mono', monospace">
            Pre-assessment
          </text>
          <circle cx={W * 0.04} cy={H * 0.12} r={5} fill="#7FE0A0" />
          <text x={W * 0.04 + 10} y={H * 0.12 + 4} fontSize={10} fill="#9FB6BC" fontFamily="'JetBrains Mono', monospace">
            Post-assessment
          </text>
        </g>
      )}
    </svg>
  );
}
