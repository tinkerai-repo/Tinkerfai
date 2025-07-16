import * as React from "react";

interface SubtaskCompletedProps extends React.SVGProps<SVGSVGElement> {
  fill?: string;
  size?: number | string;
}

const SubtaskCompleted: React.FC<SubtaskCompletedProps> = ({
  fill = "black",
  size = 100,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M50 100C56.5661 100 63.0679 98.7067 69.1342 96.194C75.2004 93.6812 80.7124 89.9983 85.3553 85.3553C89.9983 80.7124 93.6812 75.2004 96.194 69.1342C98.7067 63.0679 100 56.5661 100 50C100 43.4339 98.7067 36.9321 96.194 30.8658C93.6812 24.7995 89.9983 19.2876 85.3553 14.6447C80.7124 10.0017 75.2004 6.31876 69.1342 3.80602C63.0679 1.29329 56.5661 -9.78424e-08 50 0C36.7392 1.97602e-07 24.0215 5.26784 14.6447 14.6447C5.26784 24.0215 0 36.7392 0 50C0 63.2608 5.26784 75.9785 14.6447 85.3553C24.0215 94.7321 36.7392 100 50 100ZM48.7111 70.2222L76.4889 36.8889L67.9556 29.7778L44.0667 58.4389L31.7056 46.0722L23.85 53.9278L40.5167 70.5944L44.8167 74.8944L48.7111 70.2222Z"
      fill={fill}
    />
  </svg>
);

export default SubtaskCompleted;
