import React from "react";

/**
 * StrengthsRadarChart Component
 * Displays a radar chart (spider chart) showing 6 strengths in a clock layout
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of strength data objects with 
 *   { name, value, average, percentage } where value/percentage is 0-100
 * @param {Number} props.size - Size of the chart in pixels (default: 500)
 * @param {String} props.title - Chart title (default: "Strengths Compass - Full Radar Chart (Clock Layout)")
 */
export default function StrengthsRadarChart({ 
  data = [], 
  size = 600,
  widthsize = 1000,
  heightsize = 700,
  title = "Strengths Compass - Full Radar Chart (Clock Layout)"
}) {
  // Default dummy data if none provided
  const defaultData = [
    { name: "Caring & Connection", value: 88 },
    { name: "Humility & Integrity", value: 98 },
    { name: "Drive & Achievement", value: 83 },
    { name: "Resilience & Adaptability", value: 71 },
    { name: "Leadership & Growth Orientation", value: 84 },
    { name: "Optimism & Innovation", value: 89 },
  ];

  const chartData = (data.length > 0 ? data : defaultData).map((item) => ({
    ...item,
    // Normalize percentage and average values
    percentage:
      item.percentage !== undefined && item.percentage !== null
        ? item.percentage
        : item.value ?? 0,
    average:
      item.average !== undefined && item.average !== null
        ? item.average
        : item.avgRawScore ?? null,
  }));

  // Ensure we have exactly 6 data points
  if (chartData.length !== 6) {
    console.warn("StrengthsRadarChart expects exactly 6 data points");
  }

  // Chart configuration
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35; // Chart radius (35% of size)
  const labelRadius = size * 0.42; // Label position radius

  // Clock positions for 6 axes, ordered to match the polygon path:
  // 12:00, 02:00, 04:00, 06:00, 08:00, 10:00
  const positions = [
    { angle: -90, label: "top" },           // 12 o'clock
    { angle: -30, label: "top-right" },     // 2 o'clock
    { angle: 30, label: "bottom-right" },   // 4 o'clock
    { angle: 90, label: "bottom" },         // 6 o'clock
    { angle: 150, label: "bottom-left" },   // 8 o'clock
    { angle: -150, label: "top-left" },     // 10 o'clock
  ];

  // Convert degrees to radians
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  // Calculate point on circle
  const getPoint = (angle, distance) => {
    const rad = toRadians(angle);
    return {
      x: centerX + distance * Math.cos(rad),
      y: centerY + distance * Math.sin(rad),
    };
  };

  // Helper to normalise cluster names for matching
  const normalizeName = (name = "") =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Helper to split cluster name into 2 lines
  // Exceptions: "Leadership & Growth Orientation" and "Caring & Connection" stay in one line
  const splitNameIntoLines = (name = "") => {
    const normalized = normalizeName(name);
    
    // Keep these in one line
    if (
      normalized.includes("leadership") && 
      normalized.includes("growth") && 
      normalized.includes("orientation")
    ) {
      return [name, ""];
    }
    
    if (
      normalized.includes("caring") && 
      normalized.includes("connection")
    ) {
      return [name, ""];
    }
    
    // For other names, split at "&" if present
    if (name.includes("&")) {
      const parts = name.split("&");
      if (parts.length === 2) {
        return [parts[0].trim() + " &", parts[1].trim()];
      }
    }
    
    // Default: split at middle if multiple words
    const words = name.split(" ");
    if (words.length > 2) {
      const midPoint = Math.ceil(words.length / 2);
      return [words.slice(0, midPoint).join(" "), words.slice(midPoint).join(" ")];
    }
    
    return [name, ""];
  };

  // Desired cluster ordering with clock positions and labels
  // This MUST have the same order as `positions` above
  const clusterOrder = [
    {
      clock: "12:00",
      label: "C5: Leadership & Growth",
      keys: [
        "c5",
        "leadership&growthorientation",
        "leadershipgrowthorientation",
        "leadership&growth",
      ],
    },
    {
      clock: "02:00",
      label: "C3: Drive & Achievement",
      keys: ["c3", "drive&achievement", "driveachievement"],
    },
    {
      clock: "04:00",
      label: "C4: Resilience & Adaptability",
      keys: ["c4", "resilience&adaptability", "resilienceadaptability"],
    },
    {
      clock: "08:00",
      label: "C1: Caring & Connection",
      keys: ["c1", "caring&connection", "caringconnection"],
    },
    {
      clock: "10:00",
      label: "C6: Optimism & Innovation",
      keys: ["c6", "optimism&innovation", "optimisminnovation"],
    },
    {
      clock: "06:00",
      label: "C2: Humility & Integrity",
      keys: ["c2", "humility&integrity", "humilityintegrity"],
    },
  ];

  // Build ordered data array based on clusterOrder
  const orderedData = clusterOrder.map((cfg, index) => {
    const match = chartData.find((item) => {
      const n = normalizeName(item.name);
      return cfg.keys.some((k) => n.includes(k) || k.includes(n));
    });

    return {
      // Fallback to keep polygon intact even if data missing
      name: match?.name || cfg.label,
      percentage:
        match?.percentage !== undefined && match?.percentage !== null
          ? match.percentage
          : 0,
      average:
        match?.average !== undefined && match?.average !== null
          ? match.average
          : null,
      _clock: cfg.clock,
      _orderIndex: index,
    };
  });

  // Generate polygon points for the data (using percentage)
  const polygonPoints = orderedData
    .map((item, index) => {
      const angle = positions[index]?.angle || -90;
      const normalizedValue = Math.max(
        0,
        Math.min(100, item.percentage ?? item.value ?? 0)
      );
      const distance = (normalizedValue / 100) * radius;
      const point = getPoint(angle, distance);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  // Generate concentric circles
  const circles = [20, 40, 60, 80, 100].map((value) => ({
    radius: (value / 100) * radius,
    label: value,
  }));

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg border border-neutral-border-light">
      <h3 className="text-lg font-semibold neutral-text mb-4 text-center">
        {title}
      </h3>
      
      <div className="w-full max-w-full overflow-hidden flex justify-center">
        <svg
          width={widthsize}
          height={heightsize}
          viewBox={`0 0 ${size} ${size}`}
          className="strengths-radar-chart max-w-full h-auto"
          style={{ fontFamily: "'Poppins', sans-serif" }}
          preserveAspectRatio="xMidYMid meet"
        >
        {/* Concentric circles (grid lines) */}
        {circles.map((circle, index) => (
          <g key={index}>
            <circle
              cx={centerX}
              cy={centerY}
              r={circle.radius}
              fill="none"
              stroke={index === circles.length - 1 ? "#9ca3af" : "#e5e7eb"}
              strokeWidth={index === circles.length - 1 ? 1.5 : 1}
              strokeDasharray={index === circles.length - 1 ? "none" : "3,3"}
            />
            {/* Circle labels - show all including 20 */}
            <text
              x={centerX + circle.radius + 10}
              y={centerY + 5}
              fontSize="14"
              fill="#6b7280"
              textAnchor="start"
              className="font-semibold"
              fontWeight="600"
            >
              {circle.label}
            </text>
          </g>
        ))}

        {/* Center label (0) */}
        <text
          x={centerX}
          y={centerY + 5}
          fontSize="14"
          fill="#6b7280"
          textAnchor="middle"
          className="font-semibold"
          fontWeight="600"
        >
          0
        </text>

        {/* Axes (spokes) */}
        {positions.map((pos, index) => {
          const endPoint = getPoint(pos.angle, radius);
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon (filled area) */}
        <polygon
          points={polygonPoints}
          fill="rgba(251, 146, 60, 0.3)"
          stroke="#fb923c"
          strokeWidth="2"
          fillOpacity="0.4"
        />

        {/* Data points (dots on axes) */}
        {orderedData.map((item, index) => {
          const angle = positions[index]?.angle || -90;
          const normalizedValue = Math.max(
            0,
            Math.min(100, item.percentage ?? item.value ?? 0)
          );
          const distance = (normalizedValue / 100) * radius;
          const point = getPoint(angle, distance);
          return (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#fb923c"
              stroke="#fff"
              strokeWidth="2"
            />
          );
        })}

        {/* Labels for each strength */}
        {orderedData.map((item, index) => {
          const angle = positions[index]?.angle || -90;
          const labelPoint = getPoint(angle, labelRadius);
          const normalizedValue = Math.max(
            0,
            Math.min(100, item.percentage ?? item.value ?? 0)
          );
          
          // Determine text anchor based on position
          let textAnchor = "middle";
          if (angle === -90) textAnchor = "middle"; // top
          else if (angle === -30) textAnchor = "start"; // top-right
          else if (angle === 30) textAnchor = "start"; // bottom-right
          else if (angle === 90) textAnchor = "middle"; // bottom
          else if (angle === 150) textAnchor = "end"; // bottom-left
          else if (angle === -150) textAnchor = "end"; // top-left

          // Adjust label position slightly outward
          const labelDistance = labelRadius + 15;
          const adjustedLabelPoint = getPoint(angle, labelDistance);
          
          // Split name into lines (exceptions handled in function)
          const nameLines = splitNameIntoLines(item.name);
          const isTwoLines = nameLines[1] && nameLines[1].trim() !== "";

          return (
            <g key={index}>
              {/* Strength name label - 2 lines for most, 1 line for exceptions */}
              <text
                x={adjustedLabelPoint.x}
                y={adjustedLabelPoint.y - (isTwoLines ? 8 : 0)}
                fontSize="16"
                fill="#1e293b"
                textAnchor={textAnchor}
                className="font-bold"
                fontWeight="700"
                style={{ dominantBaseline: "middle" }}
              >
                <tspan x={adjustedLabelPoint.x} dy="0" textAnchor={textAnchor}>
                  {nameLines[0]}
                </tspan>
                {isTwoLines && (
                  <tspan x={adjustedLabelPoint.x} dy="20" textAnchor={textAnchor}>
                    {nameLines[1]}
                  </tspan>
                )}
              </text>
              {/* Value label */}
              <text
                x={adjustedLabelPoint.x}
                y={adjustedLabelPoint.y + (isTwoLines ? 32 : 20)}
                fontSize="14"
                fill="#64748b"
                textAnchor={textAnchor}
                className="font-semibold"
                fontWeight="600"
                style={{ dominantBaseline: "middle" }}
              >
                {normalizedValue}%
              </text>
            </g>
          );
        })}
      </svg>
      </div>

    </div>
  );
}

