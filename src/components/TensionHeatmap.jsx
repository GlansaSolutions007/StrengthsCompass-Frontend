import React, { useMemo } from "react";

/**
 * TensionHeatmap Component
 * Displays a heatmap showing absolute differences between cluster scores
 * Uses green color scheme: dark green (low Δ) → light green → darker green (mid) → (higher Δ)
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of cluster data objects with { name, percentage } or { name, value }
 */
export default function TensionHeatmap({ data = [] }) {
  // Utility functions
  const lerp = (a, b, t) => a + (b - a) * t;
  
  const rgbInter = (a, b, t) => [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t))
  ];
  
  const rgbToStr = (r) => `rgb(${r[0]},${r[1]},${r[2]})`;

  // Color map matching green style: dark green (low Δ) → light green → darker green (mid) → (higher Δ)
  const valueToColor = (v, max) => {
    if (max <= 0) return 'rgb(230,245,235)';
    const t = Math.max(0, Math.min(1, v / max));
    const stops = [
      [0, 68, 27],      // deep forest green (low Δ)
      [35, 139, 69],    // medium green (mid Δ)
      [161, 217, 155]   // pale green (high Δ)
    ];
    
    if (t <= 0.5) {
      const p = t / 0.5;
      return rgbToStr(rgbInter(stops[0], stops[1], p));
    } else {
      const p = (t - 0.5) / 0.5;
      return rgbToStr(rgbInter(stops[1], stops[2], p));
    }
  };

  // Compute tension matrix (absolute differences)
  const computeTensionMatrix = (values) => {
    const n = values.length;
    const mat = Array.from({ length: n }, () => Array(n).fill(0));
    let max = 0;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const d = Math.abs(values[i] - values[j]);
        mat[i][j] = d;
        if (d > max) max = d;
      }
    }
    
    return { mat, max };
  };

  // Extract labels and values from data
  const { labels, values } = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], values: [] };
    }

    const extractedLabels = data.map(item => item.name || '');
    const extractedValues = data.map(item => {
      // Prefer percentage, then value, default to 0
      return item.percentage !== undefined ? item.percentage : 
             item.value !== undefined ? item.value : 0;
    });

    return {
      labels: extractedLabels,
      values: extractedValues.map(v => Math.round(v))
    };
  }, [data]);

  // Compute matrix
  const { mat, max } = useMemo(() => {
    if (values.length === 0) return { mat: [], max: 0 };
    return computeTensionMatrix(values);
  }, [values]);

  // Generate legend gradient
  const legendGradient = useMemo(() => {
    if (max === 0) return 'linear-gradient(to top, rgb(230,245,235), rgb(230,245,235), rgb(230,245,235))';
    return `linear-gradient(to top, ${valueToColor(max, max)}, ${valueToColor(max * 0.5, max)}, ${valueToColor(0, max)})`;
  }, [max]);

  // Wrap text for Y-axis labels
  const wrapTextLines = (text, maxLen) => {
    const parts = text.split(' ');
    const lines = [];
    let cur = '';
    for (const p of parts) {
      if ((cur + ' ' + p).trim().length > maxLen) {
        lines.push(cur.trim());
        cur = p;
      } else {
        cur = (cur + ' ' + p).trim();
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  if (labels.length === 0 || values.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-neutral-border-light p-6">
        <h3 className="text-xl font-semibold neutral-text mb-4">Tension / Synergy Heatmap</h3>
        <p className="text-sm text-gray-600">No data available for heatmap</p>
      </div>
    );
  }

  // Layout constants (bigger size for better visibility)
  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 80;
  const LABEL_WIDTH = 140;

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-neutral-border-light p-6">
      <h3 className="text-xl font-semibold neutral-text mb-4">Tension / Synergy Heatmap</h3>
      
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Heatmap Table */}
          <div className="flex-1 w-full overflow-hidden">
            <div className="w-full flex justify-center">
              <table 
              className="border-collapse bg-white"
              style={{ 
                tableLayout: 'fixed'
              }}
            >
              <thead>
                <tr>
                  <th 
                    className="text-center border border-gray-200 font-semibold bg-transparent p-2"
                    style={{ width: `${LABEL_WIDTH}px`, minWidth: `${LABEL_WIDTH}px`, fontSize: '12px' }}
                  ></th>
                  {labels.map((label, idx) => (
                    <th
                      key={idx}
                      className="text-center border border-gray-200 font-semibold bg-transparent"
                      style={{ 
                        width: `${CELL_WIDTH}px`, 
                        minWidth: `${CELL_WIDTH}px`, 
                        fontSize: '11px',
                        padding: '8px 4px',
                        height: 'auto',
                        verticalAlign: 'middle',
                        fontWeight: 600
                      }}
                    >
                      <div 
                        style={{
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          textAlign: 'center',
                          lineHeight: '1.3'
                        }}
                      >
                        {label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mat.map((row, i) => {
                  const yLabelLines = wrapTextLines(labels[i], 22);
                  return (
                    <tr key={i}>
                      <th 
                        className="text-center border border-gray-200 font-semibold bg-transparent p-2"
                        style={{ width: `${LABEL_WIDTH}px`, minWidth: `${LABEL_WIDTH}px`, fontSize: '12px' }}
                      >
                        {yLabelLines.map((line, lineIdx) => (
                          <div key={lineIdx} style={{ lineHeight: '1.2', fontSize: '11px' }}>
                            {line}
                          </div>
                        ))}
                      </th>
                      {row.map((value, j) => {
                        const bgColor = valueToColor(value, max);
                        const textColor = (max > 0 && value / max > 0.6) ? '#fff' : '#071133';
                        
                        return (
                          <td
                            key={j}
                            className="text-center border border-white border-opacity-15 font-bold"
                            style={{
                              width: `${CELL_WIDTH}px`,
                              minWidth: `${CELL_WIDTH}px`,
                              height: `${CELL_HEIGHT}px`,
                              backgroundColor: bgColor,
                              color: textColor,
                              padding: '4px',
                              verticalAlign: 'middle',
                              fontSize: '12px'
                            }}
                          >
                            {/* Numbers removed */}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <p className="text-xs text-gray-600 mt-3 text-center" style={{ fontSize: '10px' }}>
              This heatmap shows the absolute difference (Δ) between cluster scores. Higher values indicate greater tension/difference between clusters.
            </p>
          </div>

          {/* Legend - Right side */}
          <div className="flex flex-col items-center gap-2" style={{ minWidth: '80px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Legend</div>
            <div
              className="rounded-md border border-gray-200"
              style={{
                width: '28px',
                height: '360px',
                background: legendGradient
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
