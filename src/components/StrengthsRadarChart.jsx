import React from "react";

/**
 * StrengthsRadarChart Component
 * Displays a radar chart (spider chart) showing strengths in a clock layout
 *
 * @param {Object} props
 * @param {Object} props.clusterScores - Object with cluster names as keys and score objects as values
 *   Each score object should have { average, percentage, ... }
 * @param {Array} props.clusters - Array of cluster names in display order
 * @param {Number} props.size - Size of the chart in pixels (default: 500)
 * @param {String} props.title - Chart title (default: "Strengths Compass - Full Radar Chart (Clock Layout)")
 */
export default function StrengthsRadarChart({
  clusterScores = {},
  clusters = [],
  size = 600,
  widthsize = 1000,
  heightsize = 700,
  title = "Strengths Compass - Cluster Radar Chart (Clock Layout)"
}) {
  // If clusters prop provided, use it; otherwise use keys from clusterScores
  const clusterNames = clusters.length > 0 ? clusters : Object.keys(clusterScores);

  // Convert clusterScores to data array in the order of clusters
  const data = clusterNames.map(name => ({
    name,
    percentage: clusterScores[name]?.percentage || 0,
    average: clusterScores[name]?.average || 0,
  }));

  // Create cluster config from names (dynamic count)
  const clusterConfig = clusterNames.map((name, index) => ({
    id: `c${index + 1}`,
    name,
    order: index,
  }));

  const numClusters = clusterConfig.length;

  // Chart configuration
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35; // Chart radius (35% of size)
  const labelRadius = size * 0.42; // Label position radius

  // Generate positions dynamically based on number of clusters (start from top, -90°)
  const positions = Array.from({ length: numClusters }, (_, index) => {
    const angle = numClusters > 0 ? (360 / numClusters) * index - 90 : -90;
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

  // Build ordered data array based on cluster configuration
  const orderedData = clusterConfig.map((cluster, index) => {
    const match = data.find((item) => {
      const n = normalizeName(item.name);
      const clusterNormalized = normalizeName(cluster.name);
      return n.includes(cluster.id.toLowerCase()) ||
             clusterNormalized.includes(n) ||
             n.includes(clusterNormalized);
    });

    return {
      // Fallback to keep polygon intact even if data missing
      name: match?.name || cluster.name,
      percentage:
        match?.percentage !== undefined && match?.percentage !== null
          ? match.percentage
          : 0,
      average:
        match?.average !== undefined && match?.average !== null
          ? match.average
          : null,
      _clusterId: cluster.id,
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
          const angle = positions[index]?.angle ?? -90;
          const normalizedValue = Math.max(
            0,
            Math.min(100, item.percentage ?? item.value ?? 0)
          );

          // Determine text anchor based on angle (dynamic for any number of axes)
          let textAnchor = "middle";
          const angleNorm = ((angle % 360) + 360) % 360;
          if (angleNorm >= 315 || angleNorm < 45) textAnchor = "middle";   // top
          else if (angleNorm >= 45 && angleNorm < 135) textAnchor = "start";  // right
          else if (angleNorm >= 135 && angleNorm < 225) textAnchor = "middle"; // bottom
          else if (angleNorm >= 225 && angleNorm < 315) textAnchor = "end";   // left

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

