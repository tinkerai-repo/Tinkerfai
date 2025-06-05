import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./ChatBotSection.css";
import scrollDown from "../assets/scroll-down.png";

interface ChatBotHandleOverlayProps {
  bottom: string;
  onDrag: (percent: number) => void;
  isMax: boolean;
  onCollapse: () => void;
}

const MAX_HEIGHT = 50;

const ChatBotHandleOverlay: React.FC<ChatBotHandleOverlayProps> = ({
  bottom,
  onDrag,
  isMax,
  onCollapse,
}) => {
  const [hover, setHover] = useState(false);
  const handle = (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom,
        transform: "translate(-50%, 50%)",
        zIndex: 100,
        transition: "bottom 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
      className="drag-handle"
    >
      <button
        className="collapse-btn"
        onClick={(e) => {
          e.stopPropagation();
          isMax ? onCollapse() : onDrag(MAX_HEIGHT);
        }}
        aria-label={isMax ? "Collapse Chatbot" : "Expand Chatbot"}
        style={{
          width: "3vh",
          height: "3vh",
          padding: 0,
          background: "none",
          border: "none",
          position: "relative",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Show scroll-down arrow on hover when expanded */}
        {isMax && hover ? (
          <img
            src={scrollDown}
            alt="Scroll down"
            style={{ width: "2.5vh", height: "2.5vh", display: "block" }}
          />
        ) : (
          <svg
            width="3vh"
            height="3vh"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="4"
              y="6"
              width="20"
              height="12"
              rx="6"
              fill={isMax ? "#4caf50" : "#888"}
              stroke="#222"
              strokeWidth="2"
            />
            <circle cx="10" cy="12" r="1.5" fill="#fff" />
            <circle cx="14" cy="12" r="1.5" fill="#fff" />
            <circle cx="18" cy="12" r="1.5" fill="#fff" />
            <path
              d="M10 18L8 22L14 18H18"
              stroke="#222"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );

  return ReactDOM.createPortal(handle, document.body);
};

export default ChatBotHandleOverlay;
