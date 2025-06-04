import React, { useState, useRef, useEffect } from "react";
import "./Header.css";
import logo from "../assets/tinkerfai-logo.png";
import coinIcon from "../assets/coin-icon.png";

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="header-bar">
      <div className="header-logo-container">
        <img src={logo} alt="Tinkerfai Logo" className="header-logo" />
      </div>
      <div
        style={{ display: "flex", alignItems: "center", marginRight: "2vw" }}
      >
        <div className="header-coin-counter">
          <img src={coinIcon} alt="Coins" className="header-coin-icon" />
          <span className="header-coin-number">00050</span>
        </div>
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            className="header-profile-icon"
            aria-label="Profile"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 36 36"
              style={{ display: "block" }}
            >
              <circle
                cx="18"
                cy="12"
                r="7"
                fill="none"
                stroke="#222"
                strokeWidth="2"
              />
              <path
                d="M6 30c0-5 7-7 12-7s12 2 12 7"
                fill="none"
                stroke="#222"
                strokeWidth="2"
              />
            </svg>
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 48,
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                borderRadius: 8,
                minWidth: 180,
                zIndex: 200,
                padding: "8px 0",
                color: "#222",
              }}
            >
              <div style={{ padding: "8px 20px", cursor: "pointer" }}>
                My Profile
              </div>
              <div style={{ padding: "8px 20px", cursor: "pointer" }}>
                My Badges
              </div>
              <div style={{ padding: "8px 20px", cursor: "pointer" }}>
                Explore Community
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
