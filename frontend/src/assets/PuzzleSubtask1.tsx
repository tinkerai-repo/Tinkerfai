import * as React from "react";

interface Props extends React.SVGProps<SVGSVGElement> {
  fill?: string;
  height?: number | string;
}

const PuzzleSubtask1: React.FC<Props> = ({
  fill = "#1E1E1E",
  height = 320,
  ...props
}) => (
  <svg
    width={height}
    height={height}
    viewBox="0 0 320 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="280" cy="125" r="40" fill={fill} />
    <circle cx="125" cy="280" r="40" fill={fill} />
    <path
      d="M240 0C245.523 2.89916e-06 250 4.47715 250 10V240C250 245.523 245.523 250 240 250H10C4.47716 250 0 245.523 0 240V10C2.89925e-06 4.47716 4.47715 0 10 0H240Z"
      fill={fill}
    />
  </svg>
);

export default PuzzleSubtask1;
