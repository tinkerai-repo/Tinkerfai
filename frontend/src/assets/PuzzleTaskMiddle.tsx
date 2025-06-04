import * as React from "react";

interface Props extends React.SVGProps<SVGSVGElement> {
  fill?: string;
  height?: number | string;
}

const PuzzleTaskMiddle: React.FC<Props> = ({
  fill = "#1E1E1E",
  height = 250,
  ...props
}) => (
  <svg
    width={height}
    height={height}
    viewBox="0 0 320 250"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="280" cy="125" r="40" fill={fill} />
    <path
      d="M240 0C245.523 2.89916e-06 250 4.47715 250 10V240C250 245.523 245.523 250 240 250H10C4.47716 250 0 245.523 0 240V151.454C7.32949 159.76 18.052 165 30 165C52.0914 165 70 147.091 70 125C70 102.909 52.0914 85 30 85C18.0522 85 7.32948 90.2397 0 98.5449V10C2.89925e-06 4.47716 4.47715 0 10 0H240Z"
      fill={fill}
    />
  </svg>
);

export default PuzzleTaskMiddle;
