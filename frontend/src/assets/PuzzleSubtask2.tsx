import * as React from "react";

interface Props extends React.SVGProps<SVGSVGElement> {
  fill?: string;
  height?: number | string;
}

const PuzzleSubtask2: React.FC<Props> = ({
  fill = "#1E1E1E",
  height = 250,
  ...props
}) => (
  <svg
    width={height}
    height={height}
    viewBox="0 0 250 250"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M240 0C245.523 2.89916e-06 250 4.47715 250 10V240C250 245.523 245.523 250 240 250H151.454C159.76 242.671 165 231.948 165 220C165 197.909 147.091 180 125 180C102.909 180 85 197.909 85 220C85 231.948 90.2403 242.671 98.5459 250H10C4.47716 250 0 245.523 0 240V151.454C7.32949 159.76 18.052 165 30 165C52.0914 165 70 147.091 70 125C70 102.909 52.0914 85 30 85C18.0522 85 7.32948 90.2397 0 98.5449V10C2.89925e-06 4.47716 4.47715 0 10 0H240Z"
      fill={fill}
    />
  </svg>
);

export default PuzzleSubtask2;
