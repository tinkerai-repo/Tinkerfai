import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Header from "./Header";
import profileImg from "../assets/profile.png";
import createProjectPlus from "../assets/create-project-plus.png";
import editProfileIcon from "../assets/edit-profile-icon.png";
import deleteIcon from "../assets/delete-icon.png";
import CreateProjectModal from "./CreateProjectModal";
import { projectApi, Project } from "../services/projectApi";

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

  // State for projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // State for delete functionality
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      setProjectsError(null);

      const response = await projectApi.getProjects();

      if (response.success) {
        // Sort projects by createdAt in descending order (newest first)
        const sortedProjects = response.projects.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setProjects(sortedProjects);
      } else {
        setProjectsError(response.message || "Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjectsError(
        error instanceof Error ? error.message : "Failed to fetch projects"
      );
    } finally {
      setProjectsLoading(false);
    }
  };

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

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleProjectCreated = (newProject: Project) => {
    // Add the new project to the beginning of the list and maintain sorting
    setProjects((prev) => {
      const updatedProjects = [newProject, ...prev];
      return updatedProjects.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    setModalOpen(false);
  };

  const handleProjectClick = (projectId: string) => {
    // Navigate to project page
    window.location.href = `/project/${projectId}`;
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation(); // Prevent project card click
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);

      const response = await projectApi.deleteProject(
        projectToDelete.projectId
      );

      if (response.success) {
        // Remove project from local state
        setProjects((prev) =>
          prev.filter((p) => p.projectId !== projectToDelete.projectId)
        );
        setDeleteConfirmOpen(false);
        setProjectToDelete(null);
      } else {
        alert(`Failed to delete project: ${response.message}`);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete project"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setProjectToDelete(null);
  };

  const renderProjectCard = (project: Project, index: number) => (
    <div
      className="project-card project-card-existing"
      key={project.projectId}
      onClick={() => handleProjectClick(project.projectId)}
    >
      <button
        className="project-delete-btn"
        onClick={(e) => handleDeleteClick(e, project)}
        aria-label="Delete project"
      >
        <img src={deleteIcon} alt="Delete" className="delete-icon-img" />
      </button>
      <div className="project-content">
        <h3 className="project-name">{project.projectName}</h3>
        <div className="project-meta">
          <span className={`project-type ${project.projectType}`}>
            {project.projectType}
          </span>
          <span className="project-date">
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );

  const renderCreateProjectCard = () => (
    <div
      className="project-card project-card-create"
      onClick={() => setModalOpen(true)}
    >
      <img
        src={createProjectPlus}
        alt="Create Project"
        className="project-plus-icon"
      />
      <div className="project-label">Create Project</div>
    </div>
  );

  const renderProjectsGrid = () => {
    if (projectsLoading) {
      return (
        <div className="projects-loading">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      );
    }

    if (projectsError) {
      return (
        <div className="projects-error">
          <p>Error loading projects: {projectsError}</p>
          <button onClick={fetchProjects} className="retry-button">
            Try Again
          </button>
        </div>
      );
    }

    // Always show create project card first, then existing projects
    const allCards = [
      renderCreateProjectCard(),
      ...projects.map((project, index) => renderProjectCard(project, index)),
    ];

    return <div className="projects-grid">{allCards}</div>;
  };

  return (
    <>
      <Header />
      <CreateProjectModal
        open={modalOpen}
        onClose={handleModalClose}
        onProjectCreated={handleProjectCreated}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="delete-modal-overlay" onClick={handleDeleteCancel}>
          <div
            className="delete-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Project</h3>
            <p>
              Are you sure you want to delete "{projectToDelete?.projectName}"?
              <br />
              This action cannot be undone.
            </p>
            <div className="delete-modal-buttons">
              <button
                className="delete-cancel-btn"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-btn"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="projects-title">
              Projects:{" "}
              {!projectsLoading && !projectsError && `(${projects.length})`}
            </div>
            {renderProjectsGrid()}
            <div style={{ height: "5vh" }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
