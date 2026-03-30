export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: "teacher" | "student";
  createdAt: string | Date;
}

export interface Problem {
  _id: string;
  title: string;
  link: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  order: number;
  createdAt: string | Date;
}

export interface Attachment {
  _id: string;
  name: string;
  pdfData: string; // Base64 string
}

export interface Assignment {
  _id: string;
  teacherId: string | User;
  title: string;
  description: string;
  problems: string[] | Problem[];
  attachments: Attachment[];
  notes: string;
  dueDate?: string | Date;
  assignedTo: string[] | User[];
  createdAt: string | Date;
}

export interface StudentProgress {
  _id: string;
  studentId: string | User;
  assignmentId?: string | Assignment;
  problemId: string | Problem;
  solved: boolean;
  notes: string;
  code: string;
  codeLanguage: string;
  hints: string;
  solvedAt?: string | Date;
}

export interface CanvasNote {
  _id: string;
  authorId: string | User;
  title: string;
  canvasData: any; // Mixed data for tldraw snapshot
  createdAt: string | Date;
  updatedAt: string | Date;
  sharedWith: string[] | User[];
}
