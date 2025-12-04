import React, { useMemo } from "react";

/**
 * ConstructSynergyTensionMatrix Component
 * Displays an 18x18 construct-level synergy-tension matrix
 * Uses category-based color scheme: Blue (Low) → Orange (Medium) → Green (High)
 * 
 * @param {Object} props
 * @param {Array} props.matrix - 2D array of synergy-tension values (0.1 to 1.0) for 18x18 constructs
 * @param {Array} props.labels - Array of 18 construct labels
 * @param {Object} props.constructScores - Object with construct names as keys and {category, percentage, etc.} as values
 * @param {String} props.title - Optional custom title
 */
export default function ConstructSynergyTensionMatrix({ 
  matrix = [],
  labels = [],
  constructScores = {},
  title = "Strengths Compass: 18x18 Construct Synergy-Tension Matrix"
}) {
  // Utility functions
  const lerp = (a, b, t) => a + (b - a) * t;
  
  const rgbInter = (a, b, t) => [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t))
  ];
  
  const rgbToStr = (r) => `rgb(${r[0]},${r[1]},${r[2]})`;

  // Get matrix cell color based on Delta calculation (Level 2: Construct-Level)
  // Rules:
  // - RED (Conflict): If Delta > 2.0
  // - GREEN (Flow): If Both > 4.0 AND Delta < 0.8
  // - AMBER (Growth): All else
  const getCellColorFromDelta = (average1, average2) => {
    if (average1 === null || average2 === null || average1 === undefined || average2 === undefined) {
      return 'rgb(156, 163, 175)'; // gray for missing data
    }
    
    // Calculate Delta = Construct A - Construct B
    const delta = Math.abs(average1 - average2);
    
    // RED (Conflict): If Delta > 2.0
    if (delta > 2.0) {
      return 'rgb(220, 38, 38)'; // Red
    }
    
    // GREEN (Flow): If Both > 4.0 AND Delta < 0.8
    if (average1 > 4.0 && average2 > 4.0 && delta < 0.8) {
      return 'rgb(34, 197, 94)'; // Green
    }
    
    // AMBER (Growth): All else
    return 'rgb(255, 193, 7)'; // Amber
  };

  // Legacy color function for matrix values (if matrix prop is used)
  const valueToColor = (value) => {
    const clamped = Math.max(0.1, Math.min(1.0, value));
    const normalized = (clamped - 0.1) / 0.9;
    
    const stops = [
      { t: 0.0, color: [220, 38, 38] },
      { t: 0.25, color: [249, 115, 22] },
      { t: 0.5, color: [234, 179, 8] },
      { t: 0.75, color: [134, 239, 172] },
      { t: 1.0, color: [22, 163, 74] }
    ];
    
    let stop1 = stops[0];
    let stop2 = stops[stops.length - 1];
    
    for (let i = 0; i < stops.length - 1; i++) {
      if (normalized >= stops[i].t && normalized <= stops[i + 1].t) {
        stop1 = stops[i];
        stop2 = stops[i + 1];
        break;
      }
    }
    
    const localT = stop1.t === stop2.t ? 0 : (normalized - stop1.t) / (stop2.t - stop1.t);
    return rgbToStr(rgbInter(stop1.color, stop2.color, localT));
  };

  // Default construct labels (18 constructs)
  const defaultLabels = [
    "Leadership",
    "Self-Efficacy",
    "Growth Mindset",
    "Perseverance",
    "Self-Discipline",
    "Initiative",
    "Resilience",
    "Emotional Reg",
    "Adaptability",
    "Humility",
    "Integrity",
    "Cooperation",
    "Altruism",
    "Empathy",
    "Sociability",
    "Optimism",
    "GRIT (Passion)",
    "Creativity"
  ];

  // Use labels from constructScores if available, otherwise use provided labels or defaults
  const constructLabels = useMemo(() => {
    if (labels.length > 0) return labels;
    if (constructScores && Object.keys(constructScores).length > 0) {
      return Object.keys(constructScores);
    }
    return defaultLabels;
  }, [labels, constructScores]);
  
  const numConstructs = constructLabels.length;

  // Helper to find construct in scores (case-insensitive, flexible matching)
  const findConstructInScores = (label, scores) => {
    if (!scores || !label) return null;
    
    // Direct match
    if (scores[label]) return scores[label];
    
    // Case-insensitive match
    const labelLower = label.toLowerCase();
    for (const key in scores) {
      if (key.toLowerCase() === labelLower) {
        return scores[key];
      }
    }
    
    // Partial match (e.g., "Emotional Reg" matches "Emotional Regulation")
    for (const key in scores) {
      if (key.toLowerCase().includes(labelLower) || labelLower.includes(key.toLowerCase())) {
        return scores[key];
      }
    }
    
    return null;
  };

  // Calculate matrix based on construct average values and Delta (Level 2: Construct-Level)
  const categoryMatrix = useMemo(() => {
    if (!constructScores || Object.keys(constructScores).length === 0) {
      return null;
    }
    
    // Create matrix based on construct averages and Delta calculation
    return constructLabels.map((label1, i) => {
      return constructLabels.map((label2, j) => {
        const construct1 = findConstructInScores(label1, constructScores);
        const construct2 = findConstructInScores(label2, constructScores);
        
        if (!construct1 || !construct2) {
          return { type: null, delta: null, color: 'rgb(156, 163, 175)' };
        }
        
        const average1 = construct1.average;
        const average2 = construct2.average;
        
        // If same construct (diagonal), Delta = 0, show grey
        // Check both by index and by label name to ensure all diagonal cells are handled
        if (i === j || label1 === label2) {
          return { type: 'DIAGONAL', delta: '0.00', average1: average1?.toFixed(2), average2: average2?.toFixed(2), color: 'rgb(156, 163, 175)' };
        }
        
        // Calculate Delta = Construct A - Construct B
        const delta = Math.abs(average1 - average2);
        
        // Determine type based on rules
        let type = 'AMBER'; // Default: Growth
        if (delta > 2.0) {
          type = 'RED'; // Conflict
        } else if (average1 > 4.0 && average2 > 4.0 && delta < 0.8) {
          type = 'GREEN'; // Flow
        }
        
        const color = getCellColorFromDelta(average1, average2);
        
        return { type, delta: delta.toFixed(2), average1: average1?.toFixed(2), average2: average2?.toFixed(2), color };
      });
    });
  }, [constructScores, constructLabels]);

  // Normalize matrix - ensure diagonal is 1.0 and values are between 0.1 and 1.0
  const normalizedMatrix = useMemo(() => {
    // If we have category matrix, use it
    if (categoryMatrix) {
      return categoryMatrix;
    }
    
    // Otherwise use provided matrix or default
    if (!matrix || matrix.length === 0) {
      // Return default matrix with diagonal = 1.0 if no data provided
      return Array.from({ length: numConstructs }, (_, i) =>
        Array.from({ length: numConstructs }, (_, j) => (i === j ? 1.0 : 0.5))
      );
    }
    
    const n = Math.min(matrix.length, numConstructs);
    return matrix.slice(0, n).map((row, i) => {
      const normalizedRow = row.slice(0, n).map((val, j) => {
        // Diagonal should always be 1.0
        if (i === j) return 1.0;
        // Ensure values are between 0.1 and 1.0
        return Math.max(0.1, Math.min(1.0, val || 0.1));
      });
      // Pad row if needed
      while (normalizedRow.length < numConstructs) {
        normalizedRow.push(0.5);
      }
      return normalizedRow;
    });
  }, [matrix, categoryMatrix, numConstructs]);

  // Generate legend gradient stops - delta-based (RED/AMBER/GREEN) or value-based
  const legendStops = useMemo(() => {
    // If using delta-based matrix, show RED → AMBER → GREEN
    if (categoryMatrix) {
      return 'rgb(220, 38, 38) 0%, rgb(255, 193, 7) 50%, rgb(34, 197, 94) 100%';
    }
    
    // Otherwise use value-based gradient
    const stops = [
      { value: 0.1, color: valueToColor(0.1) },
      { value: 0.3, color: valueToColor(0.3) },
      { value: 0.5, color: valueToColor(0.5) },
      { value: 0.7, color: valueToColor(0.7) },
      { value: 0.9, color: valueToColor(0.9) },
      { value: 1.0, color: valueToColor(1.0) }
    ];
    
    const percentages = [0, 20, 40, 60, 80, 100];
    return stops.map((stop, idx) => `${stop.color} ${percentages[idx]}%`).join(', ');
  }, [categoryMatrix]);

  // Layout constants - A4 size (210mm x 297mm ≈ 794px x 1123px at 96 DPI)
  // Optimized for 18x18 matrix to fit within A4 dimensions
  const CELL_WIDTH = 33;
  const CELL_HEIGHT = 33;
  const LABEL_WIDTH = 85;
  const A4_WIDTH = 794; // A4 width in pixels at 96 DPI
  const A4_HEIGHT = 1123; // A4 height in pixels at 96 DPI

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-neutral-border-light"
      style={{
        width: `${A4_WIDTH}px`,
        maxWidth: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        padding: '16px 0 16px 0'
      }}
    >
      <h3 className="text-lg font-semibold neutral-text mb-3 text-center" style={{ fontSize: '16px' }}>
        {title}
      </h3>
      
      <div className="w-full" style={{ paddingLeft: '0', paddingRight: '0' }}>
        <div className="flex flex-col gap-4 items-center">
          {/* Heatmap Table */}
          <div className="w-full overflow-x-auto" style={{ maxWidth: `${A4_WIDTH}px`, paddingLeft: '0', paddingRight: '0' }}>
            <div className="w-full flex justify-center" style={{ marginLeft: '0', marginRight: '0' }}>
              <table 
                className="border-collapse bg-white"
                style={{ 
                  tableLayout: 'fixed',
                  width: `${LABEL_WIDTH + (CELL_WIDTH * numConstructs)}px`,
                  fontSize: '8px'
                }}
              >
                <thead>
                  <tr>
                    <th 
                      className="text-center border border-gray-300 font-semibold bg-gray-50"
                      style={{ 
                        width: `${LABEL_WIDTH}px`, 
                        minWidth: `${LABEL_WIDTH}px`, 
                        fontSize: '8px',
                        padding: '2px',
                        position: 'sticky',
                        left: 0,
                        zIndex: 10,
                        backgroundColor: '#f9fafb'
                      }}
                    ></th>
                    {constructLabels.map((label, idx) => (
                      <th
                        key={idx}
                        className="text-center border border-gray-300 font-semibold bg-gray-50"
                        style={{ 
                          width: `${CELL_WIDTH}px`, 
                          minWidth: `${CELL_WIDTH}px`, 
                          fontSize: '7px',
                          padding: '2px 1px',
                          height: 'auto',
                          verticalAlign: 'bottom',
                          fontWeight: 600,
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)'
                        }}
                      >
                        <div 
                          style={{
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                            lineHeight: '1.1'
                          }}
                        >
                          {label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {normalizedMatrix.map((row, i) => (
                    <tr key={i}>
                      <th 
                        className="text-right border border-gray-300 font-semibold bg-gray-50"
                        style={{ 
                          width: `${LABEL_WIDTH}px`, 
                          minWidth: `${LABEL_WIDTH}px`, 
                          fontSize: '8px',
                          padding: '2px',
                          position: 'sticky',
                          left: 0,
                          zIndex: 5,
                          backgroundColor: '#f9fafb'
                        }}
                      >
                        <div style={{ lineHeight: '1.2', fontSize: '7px' }}>
                          {constructLabels[i]}
                        </div>
                      </th>
                      {row.map((cellData, j) => {
                        // Handle both delta-based (object with type) and value-based (number) matrix
                        const isDeltaMatrix = typeof cellData === 'object' && cellData !== null && cellData.type !== undefined;
                        const bgColor = isDeltaMatrix ? cellData.color : valueToColor(cellData);
                        
                        // Use white text for RED (darker), dark text for GREEN, AMBER, and DIAGONAL (grey)
                        const textColor = isDeltaMatrix 
                          ? (cellData.type === 'RED' ? '#fff' : '#1f2937')
                          : (cellData < 0.5 ? '#fff' : '#1f2937');
                        
                        const tooltipText = isDeltaMatrix
                          ? cellData.type === 'DIAGONAL'
                            ? `${constructLabels[i]} vs ${constructLabels[j]}: Delta=0.00 (Same Construct)`
                            : `${constructLabels[i]} (${cellData.average1}) vs ${constructLabels[j]} (${cellData.average2}): Delta=${cellData.delta}, Type=${cellData.type}`
                          : `${constructLabels[i]} vs ${constructLabels[j]}: ${cellData.toFixed(2)}`;
                        
                        return (
                          <td
                            key={j}
                            className="text-center border border-gray-200 font-semibold"
                            style={{
                              width: `${CELL_WIDTH}px`,
                              minWidth: `${CELL_WIDTH}px`,
                              height: `${CELL_HEIGHT}px`,
                              backgroundColor: bgColor,
                              color: textColor,
                              padding: '1px',
                              verticalAlign: 'middle',
                              fontSize: '7px'
                            }}
                            title={tooltipText}
                          >
                            {/* Optional: Show value as tooltip only */}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </div>

          {/* Legend - Horizontal below the graph */}
          <div className="flex flex-col items-center gap-2 w-full" style={{ maxWidth: `${A4_WIDTH}px` }}>
            
            <div className="relative flex items-center justify-center w-full" style={{ height: '60px' }}>
              <div
                className="rounded-md border border-gray-300"
                style={{
                  width: `${LABEL_WIDTH + (CELL_WIDTH * numConstructs)}px`,
                  height: '30px',
                  background: `linear-gradient(to right, ${legendStops})`
                }}
              ></div>
              <div 
                className="absolute flex flex-row justify-between items-center mt-2 mb-2"
                style={{ 
                  top: '40px',
                  left: `${LABEL_WIDTH}px`,
                  width: `${CELL_WIDTH * numConstructs}px`,
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {categoryMatrix ? (
                  <>
                    <div style={{ flex: '0 0 auto', textAlign: 'left' }}>RED (Conflict)</div>
                    <div style={{ flex: '1 1 auto', textAlign: 'center' }}>AMBER (Growth)</div>
                    <div style={{ flex: '0 0 auto', textAlign: 'right' }}>GREEN (Flow)</div>
                  </>
                ) : (
                  <>
                    <div>0.1</div>
                    <div>0.3</div>
                    <div>0.5</div>
                    <div>0.7</div>
                    <div>0.9</div>
                    <div>1.0</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

