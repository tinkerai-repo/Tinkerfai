import React from "react";

interface PuzzleSplittedTaskProps {
  color?: string;
  height?: number | string;
  className?: string;
}

const PuzzleSplittedTask: React.FC<PuzzleSplittedTaskProps> = ({
  color = "#1E1E1E",
  height = 150,
  className = "",
}) => {
  return (
    <svg
      width="300"
      height="300"
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: "block",
        margin: 0,
        padding: 0,
        height: height,
        width: "100%",
        boxSizing: "border-box",
        transition: "height 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <rect
        x="130.435"
        y="130.435"
        width="130.435"
        height="130.435"
        rx="10"
        transform="rotate(-180 130.435 130.435)"
        fill={color}
      />
      <rect
        x="130.435"
        y="300"
        width="130.435"
        height="130.435"
        rx="10"
        transform="rotate(-180 130.435 300)"
        fill={color}
      />
      <rect
        x="300"
        y="130.435"
        width="130.435"
        height="130.435"
        rx="10"
        transform="rotate(-180 300 130.435)"
        fill={color}
      />
      <rect
        x="300"
        y="300"
        width="130.435"
        height="130.435"
        rx="10"
        transform="rotate(-180 300 300)"
        fill={color}
      />
    </svg>
  );
};

export default PuzzleSplittedTask;
