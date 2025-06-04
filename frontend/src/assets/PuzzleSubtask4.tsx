import * as React from "react";

interface Props extends React.SVGProps<SVGSVGElement> {
  fill?: string;
  height?: number | string;
}

const PuzzleSubtask4: React.FC<Props> = ({
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
    <circle
      cx="40"
      cy="195"
      r="40"
      transform="rotate(-180 40 195)"
      fill={fill}
    />
    <circle
      cx="195"
      cy="40"
      r="40"
      transform="rotate(-180 195 40)"
      fill={fill}
    />
    <path
      d="M80 320C74.4772 320 70 315.523 70 310L70 80C70 74.4772 74.4772 70 80 70L310 70C315.523 70 320 74.4772 320 80L320 310C320 315.523 315.523 320 310 320L80 320Z"
      fill={fill}
    />
  </svg>
);

export default PuzzleSubtask4;
