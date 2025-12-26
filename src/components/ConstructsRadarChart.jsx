import React from "react";

/**
 * ConstructsRadarChart Component
 * Displays a radar chart (spider chart) showing constructs in a dynamic layout
 *
 * @param {Object} props
 * @param {Object} props.constructScores - Object with construct names as keys and score objects as values
 *   Each score object should have { average, percentage, ... }
 * @param {Array} props.constructs - Array of construct names in display order
 * @param {Number} props.size - Size of the chart in pixels (default: 600)
 * @param {String} props.title - Chart title (default: "Constructs Radar Chart")
 */
export default function ConstructsRadarChart({
  constructScores = {},
  constructs = [],
  size = 600,
  widthsize = 1000,
  heightsize = 700,
  title = "Constructs Radar Chart"
}) {
  // If constructs prop provided, use it; otherwise use keys from constructScores
  const constructNames = constructs.length > 0 ? constructs : Object.keys(constructScores);

  // Convert constructScores to data array in the order of constructs
  const data = constructNames.map(name => ({
    name,
    percentage: constructScores[name]?.percentage || 0,
    average: constructScores[name]?.average || 0,
  }));

  // Create construct config from names
  const constructConfig = constructNames.map((name, index) => ({
    id: `construct${index + 1}`,
    name,
    order: index,
  }));

  const numConstructs = constructConfig.length;

  // Chart configuration
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.42; // Chart radius (42% of size)
  const labelRadius = size * 0.50; // Label position radius

  // Generate positions dynamically based on number of constructs
  const positions = Array.from({ length: numConstructs }, (_, index) => {
    const angle = (360 / numConstructs) * index - 90; // Start from top (-90 degrees)
    return { angle, index };
  });

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

  // Helper to normalise construct names for matching
  const normalizeName = (name = "") =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Helper to split construct name into 2 lines if needed
  const splitNameIntoLines = (name = "") => {
    const words = name.split(" ");
    if (words.length > 2) {
      const midPoint = Math.ceil(words.length / 2);
      return [words.slice(0, midPoint).join(" "), words.slice(midPoint).join(" ")];
    }
    return [name, ""];
  };

  // Build ordered data array based on construct configuration
  const orderedData = constructConfig.map((construct, index) => {
    const match = data.find((item) => {
      const n = normalizeName(item.name);
      const constructNormalized = normalizeName(construct.name);
      return n.includes(construct.id.toLowerCase()) ||
             constructNormalized.includes(n) ||
             n.includes(constructNormalized);
    });

    return {
      // Fallback to keep polygon intact even if data missing
      name: match?.name || construct.name,
      percentage:
        match?.percentage !== undefined && match?.percentage !== null
          ? match.percentage
          : 0,
      average:
        match?.average !== undefined && match?.average !== null
          ? match.average
          : null,
      _constructId: construct.id,
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
          viewBox={`-20 -20 ${size + 70} ${size + 70}`}
          className="constructs-radar-chart max-w-full h-auto"
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
              fontSize="12"
              fill="#6b7280"
              textAnchor="start"
              className="font-semibold"
              fontWeight="400"
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
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
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
              fill="#3b82f6"
              stroke="#fff"
              strokeWidth="2"
            />
          );
        })}

        {/* Labels for each construct */}
        {orderedData.map((item, index) => {
          const angle = positions[index]?.angle || -90;
          const normalizedValue = Math.max(
            0,
            Math.min(100, item.percentage ?? item.value ?? 0)
          );

          // Determine text anchor based on position
          let textAnchor = "middle";
          const angleNorm = ((angle % 360) + 360) % 360; // Normalize angle to 0-360
          if (angleNorm >= 315 || angleNorm < 45) textAnchor = "middle"; // top
          else if (angleNorm >= 45 && angleNorm < 135) textAnchor = "start"; // right
          else if (angleNorm >= 135 && angleNorm < 225) textAnchor = "middle"; // bottom
          else if (angleNorm >= 225 && angleNorm < 315) textAnchor = "end"; // left

          // Adjust label position slightly outward
          const labelDistance = labelRadius + 15;
          const adjustedLabelPoint = getPoint(angle, labelDistance);

          // Split name into lines
          const nameLines = splitNameIntoLines(item.name);
          const isTwoLines = nameLines[1] && nameLines[1].trim() !== "";

          return (
            <g key={index}>
              {/* Construct name label */}
              <text
                x={adjustedLabelPoint.x}
                y={adjustedLabelPoint.y - (isTwoLines ? 8 : 0)}
                fontSize="10"
                fill="#1e293b"
                textAnchor={textAnchor}
                className="font-semibold"
                fontWeight="600"
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
                fontSize="12"
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