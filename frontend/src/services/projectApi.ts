// API service for project-related operations

const API_BASE_URL = 'http://localhost:8000/api';

// Types for API responses
export interface Project {
  projectId: string;
  projectName: string;
  projectType: 'beginner' | 'expert';
  createdAt: string;
  updatedAt: string;
  userEmail: string;
}

export interface CreateProjectRequest {
  projectName: string;
  projectType: 'beginner' | 'expert';
}

export interface CreateProjectResponse {
  success: boolean;
  message: string;
  project: Project;
}

export interface GetProjectsResponse {
  success: boolean;
  message: string;
  projects: Project[];
}

export interface ApiError {
  success: false;
  message: string;
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    throw new Error('No access token found. Please log in again.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // Handle different error status codes
    if (response.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    
    // Try to get error message from response
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // If can't parse JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
};

// API functions
export const projectApi = {
  // Create a new project
  createProject: async (projectData: CreateProjectRequest): Promise<CreateProjectResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData),
      });

      return handleResponse<CreateProjectResponse>(response);
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  },

  // Get all projects for the current user
  getProjects: async (): Promise<GetProjectsResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return handleResponse<GetProjectsResponse>(response);
    } catch (error) {
      console.error('Get projects error:', error);
      throw error;
    }
  },

  // Get a specific project
  getProject: async (projectId: string): Promise<{ success: boolean; message: string; data: { project: Project } }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Get project error:', error);
      throw error;
    }
  },

  // Delete a project
  deleteProject: async (projectId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  },
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem('accessToken');
  return !!accessToken;
};

// Utility function to get user info from localStorage
export const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return null;
  
  try {
    return JSON.parse(userInfo);
  } catch {
    return null;
  }
};