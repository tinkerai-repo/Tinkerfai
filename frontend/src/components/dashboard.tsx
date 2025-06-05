import React from "react";
import "./dashboard.css";
import Header from "./Header";
import profileImg from "../assets/profile.png";
import createProjectPlus from "../assets/create-project-plus.png";
import editProfileIcon from "../assets/edit-profile-icon.png";

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

const Dashboard: React.FC = () => {
  return (
    <>
      <Header />
      <div className="dashboard-root">
        {/* Profile Section */}
        <div className="profile-section">
          <img
            src={editProfileIcon}
            alt="Edit Profile"
            className="edit-profile-icon"
          />
          <div className="profile-content">
            <img src={profileImg} alt="Profile" className="profile-icon" />
            <div className="profile-details">
              <div className="profile-info">
                <div className="profile-name">Name: exampleName123</div>
                <div className="profile-email">
                  Profile Email: exampleName@gmail.com
                </div>
                <div className="profile-level-label">Developer Level:</div>
              </div>
              <div className="profile-level-bar-container">
                <div className="profile-level-bar">
                  <div
                    className="profile-level-bar-progress"
                    style={{ width: "40%" }}
                  ></div>
                  <div
                    className="profile-level-knob"
                    style={{ left: "40%" }}
                  ></div>
                </div>
                <div className="profile-level-labels">
                  <span>Curious Beginner</span>
                  <span>Code Adventurer</span>
                  <span>Master Tinkerer</span>
                </div>
              </div>
              <div className="badges-section">
                <span className="badges-label">Badges:</span>
                <div className="badges-list">
                  {badges.map((badge, idx) => (
                    <div className="badge-tooltip-container" key={badge}>
                      <img
                        src={
                          new URL(`../assets/badges/${badge}`, import.meta.url)
                            .href
                        }
                        alt={`badge-${idx}`}
                        className="badge-icon"
                      />
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
                <div className="project-card" key={idx}>
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
