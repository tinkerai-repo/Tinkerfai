import React from "react";
import ReactDOM from "react-dom";
import "./ProgressSection.css";
import scrollDown from "../assets/scroll-down.png";
import scrollUp from "../assets/scroll-up.png";

interface DragHandleOverlayProps {
  top: string;
  onDrag: (percent: number) => void;
  isMax: boolean;
  onCollapse: () => void;
}

const MAX_HEIGHT = 50;

const DragHandleOverlay: React.FC<DragHandleOverlayProps> = ({
  top,
  onDrag,
  isMax,
  onCollapse,
}) => {
  const handle = (
    <div
      style={{
        position: "fixed",
        left: "50%",
        top,
        transform: "translate(-50%, -50%)",
        zIndex: 100,
        transition: "top 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
      className="drag-handle"
    >
      {isMax ? (
        <button
          className="collapse-btn"
          onClick={(e) => {
            e.stopPropagation();
            onCollapse();
          }}
          aria-label="Collapse"
          style={{
            width: "2.5vh",
            height: "2.5vh",
            padding: 0,
            background: "none",
            border: "none",
          }}
        >
          <img
            src={scrollUp}
            alt="Scroll up"
            style={{ width: "2.5vh", height: "2.5vh", display: "block" }}
          />
        </button>
      ) : (
        <button
          className="collapse-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDrag(MAX_HEIGHT);
          }}
          aria-label="Expand"
          style={{
            width: "2.5vh",
            height: "2.5vh",
            padding: 0,
            background: "none",
            border: "none",
          }}
        >
          <img
            src={scrollDown}
            alt="Scroll down"
            style={{ width: "2.5vh", height: "2.5vh", display: "block" }}
          />
        </button>
      )}
    </div>
  );

  return ReactDOM.createPortal(handle, document.body);
};

export default DragHandleOverlay;
