import React from "react";
import LockSvg from "../assets/LockSvg";
import UnlockSvg from "../assets/UnlockSvg";

interface LockIconProps {
  locked: boolean;
  color: string;
  size?: number | string;
}

const LockIcon: React.FC<LockIconProps> = ({ locked, color, size = 32 }) => {
  const Icon = locked ? LockSvg : UnlockSvg;
  return <Icon color={color} size={size} />;
};

export default LockIcon;
