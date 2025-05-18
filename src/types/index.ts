// Define types for our application

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  resume?: Resume;
  location?: string;
}

export interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx';
  uploadDate: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  salary?: string;
  postedDate: string;
  deadline?: string;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'Submitted Successfully' | 'Processing' | 'Submission Failed' | 'Shortlisted';
  submissionDate: string;
  resume: Resume;
  job: {
    title: string;
    company: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  date: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
