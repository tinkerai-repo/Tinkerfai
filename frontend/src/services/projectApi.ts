// API service for project-related operations with question system

const API_BASE_URL = 'http://localhost:8000/api';

// Existing types
export interface Project {
  projectId: string;
  projectName: string;
  projectType: 'beginner' | 'expert';
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  context_for_LLM?: string;
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

// New question system types
export type QuestionType = 'text' | 'radio' | 'file' | 'readonly';

export interface Question {
  questionId: string;
  taskIndex: number;
  subtaskIndex: number;
  questionType: QuestionType;
  questionText: string;
  options?: string[];
  isRequired: boolean;
  fileTypes?: string[];
  maxFileSize?: number;
}

export interface Answer {
  userEmail: string;
  projectId: string;
  taskIndex: number;
  subtaskIndex: number;
  questionId: string;
  answerType: QuestionType;
  textAnswer?: string;
  selectedOption?: string;
  fileName?: string;
  fileUrl?: string;
  answeredAt: string;
}

export interface DatasetSummary {
  rowCount: number;
  columnCount: number;
  columns: Array<{
    name: string;
    type: string;
    unique_values: number;
    missing_count: number;
    semantic_type: string;
    mean?: number | null;
    mode?: string | null;
  }>;
  missingValues: Record<string, number>;
  dataPreview: Array<Record<string, any>>;
}

export interface QuestionResponse {
  success: boolean;
  message: string;
  data: {
    question: Question;
    existingAnswer?: Answer;
    datasetSummary?: DatasetSummary;
  };
}

export interface AnswerSubmissionRequest {
  userEmail: string;
  projectId: string;
  taskIndex: number;
  subtaskIndex: number;
  questionId: string;
  answerType: QuestionType;
  textAnswer?: string;
  selectedOption?: string;
  fileName?: string;
  fileUrl?: string;
}

export interface ProgressResponse {
  success: boolean;
  message: string;
  data: {
    currentTask: number;
    currentSubtask: number;
    completedTasks: number[];
    completedSubtasks: Record<string, number[]>;
    totalAnswers: number;
  };
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  uploadUrl?: string;
  fileKey?: string;
}

export interface FileValidationResponse {
  success: boolean;
  message: string;
  isValid: boolean;
  validationDetails?: {
    rowCount: number;
    columnCount: number;
    columns: string[];
  };
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

// Helper function to get auth headers for form data
const getAuthHeadersForFormData = (): HeadersInit => {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    throw new Error('No access token found. Please log in again.');
  }

  return {
    'Authorization': `Bearer ${accessToken}`,
  };
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
};

// Enhanced API functions
export const projectApi = {
  // Existing project functions
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

  // New question system functions
  getQuestion: async (projectId: string, taskIndex: number, subtaskIndex: number): Promise<QuestionResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/questions/${taskIndex}/${subtaskIndex}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return handleResponse<QuestionResponse>(response);
    } catch (error) {
      console.error('Get question error:', error);
      throw error;
    }
  },

  submitAnswer: async (projectId: string, answerData: AnswerSubmissionRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/answers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(answerData),
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Submit answer error:', error);
      throw error;
    }
  },

  getProgress: async (projectId: string): Promise<ProgressResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/progress`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      return handleResponse<ProgressResponse>(response);
    } catch (error) {
      console.error('Get progress error:', error);
      throw error;
    }
  },

  // File upload functions
  getUploadUrl: async (projectId: string, taskIndex: number, subtaskIndex: number, fileName: string): Promise<FileUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('task_index', taskIndex.toString());
      formData.append('subtask_index', subtaskIndex.toString());
      formData.append('file_name', fileName);

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/upload-url`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
        body: formData,
      });

      return handleResponse<FileUploadResponse>(response);
    } catch (error) {
      console.error('Get upload URL error:', error);
      throw error;
    }
  },

  uploadFile: async (uploadUrl: string, file: File): Promise<boolean> => {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/csv',
        },
        body: file,
      });

      return response.ok;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },

  validateFile: async (projectId: string, fileKey: string): Promise<FileValidationResponse> => {
    try {
      const formData = new FormData();
      formData.append('file_key', fileKey);

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/validate-file`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
        body: formData,
      });

      return handleResponse<FileValidationResponse>(response);
    } catch (error) {
      console.error('Validate file error:', error);
      throw error;
    }
  },
};

// Utility functions
export const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem('accessToken');
  return !!accessToken;
};

export const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return null;
  
  try {
    return JSON.parse(userInfo);
  } catch {
    return null;
  }
};