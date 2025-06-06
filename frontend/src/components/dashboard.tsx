import React, { useState } from "react";
import "./Dashboard.css";
import Header from "./Header";
import profileImg from "../assets/profile.png";
import createProjectPlus from "../assets/create-project-plus.png";
import editProfileIcon from "../assets/edit-profile-icon.png";
import CreateProjectModal from "./CreateProjectModal";

const badges = [
  "green-thumb.png",
  "diversity.png",
  "business.png",
  "environmental.png",
  "gender-inclusivity.png",
  "accessibility.png",
  "culture.png",
  "medical.png",
];

const badgeThemes: { [key: string]: string } = {
  "environmental.png": "environmental awareness",
  "medical.png": "medical innovation",
  "diversity.png": "fostering diversity",
  "culture.png": "celebrating culture",
  "green-thumb.png": "green thumb",
  "accessibility.png": "accessibility advocate",
  "gender-inclusivity.png": "gender inclusivity",
  "business.png": "small business, big dreams",
};

const devLevels = ["Curious Beginner", "Code Adventurer", "Master Tinkerer"];

const Dashboard: React.FC = () => {
  // State for edit mode
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const fullName =
    userInfo.firstName && userInfo.lastName
      ? `${userInfo.firstName} ${userInfo.lastName}`
      : "Unknown User";
  const email = userInfo.email || "Unknown Email";

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(fullName);
  const [level, setLevel] = useState(1); // 0, 1, 2
  const [tempName, setTempName] = useState(name);
  const [tempLevel, setTempLevel] = useState(level);
  const [modalOpen, setModalOpen] = useState(false);

  const handleEdit = () => {
    setTempName(name);
    setTempLevel(level);
    setEditMode(true);
  };

  const handleCancel = () => {
    setTempName(name);
    setTempLevel(level);
    setEditMode(false);
  };

  const handleModify = () => {
    setName(tempName);
    setLevel(tempLevel);
    setEditMode(false);
  };

  return (
    <>
      <Header />
      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      <div className="dashboard-root">
        {/* Profile Section */}
        <div className="profile-section">
          {!editMode && (
            <img
              src={editProfileIcon}
              alt="Edit Profile"
              className="edit-profile-icon"
              onClick={handleEdit}
            />
          )}
          <div className="profile-content">
            <img src={profileImg} alt="Profile" className="profile-icon" />
            <div className="profile-details">
              <div className="profile-info">
                <div className="profile-name">
                  Name:{" "}
                  {editMode ? (
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="profile-name-input"
                    />
                  ) : (
                    name
                  )}
                </div>
                <div className="profile-email">Profile Email: {email}</div>
                <div className="profile-level-label">Developer Level:</div>
              </div>
              <div className="profile-level-bar-container">
                <div className="profile-level-bar">
                  <div
                    className="profile-level-bar-progress"
                    style={{
                      width: `${((editMode ? tempLevel : level) / 2) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="profile-level-labels">
                  <span>Curious Beginner</span>
                  <span>Code Adventurer</span>
                  <span>Master Tinkerer</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={1}
                  value={editMode ? tempLevel : level}
                  onChange={(e) =>
                    editMode ? setTempLevel(Number(e.target.value)) : undefined
                  }
                  className="profile-slider-input"
                  disabled={!editMode}
                  style={
                    {
                      "--percent": `${
                        ((editMode ? tempLevel : level) / 2) * 100
                      }`,
                    } as React.CSSProperties
                  }
                />
              </div>
              {editMode && (
                <div className="profile-edit-buttons">
                  <button className="profile-modify-btn" onClick={handleModify}>
                    Modify
                  </button>
                  <button className="profile-cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              )}
              <div className="badges-section">
                <span className="badges-label">Badges:</span>
                <div className="badges-list">
                  {badges.map((badge, idx) => (
                    <div
                      className="badge-tooltip-container"
                      key={badge}
                      style={{ position: "relative" }}
                    >
                      <img
                        src={
                          new URL(`../assets/badges/${badge}`, import.meta.url)
                            .href
                        }
                        alt={`badge-${idx}`}
                        className="badge-icon"
                      />
                      <span className="badge-count-circle">x1</span>
                      <span className="badge-tooltip">
                        {badgeThemes[badge]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="projects-section">
          <div className="projects-content">
            <div className="projects-title">Projects:</div>
            <div className="projects-grid">
              {[...Array(8)].map((_, idx) => (
                <div
                  className="project-card"
                  key={idx}
                  onClick={() => setModalOpen(true)}
                >
                  <img
                    src={createProjectPlus}
                    alt="Create Project"
                    className="project-plus-icon"
                  />
                  <div className="project-label">Create Project</div>
                </div>
              ))}
            </div>
            <div style={{ height: "5vh" }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
