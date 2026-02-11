// Mock database for demonstration
// In production, replace with MongoDB/PostgreSQL

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: 'student' | 'faculty' | 'admin';
  publicKey: string;
  privateKey: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  studentId: string;
  fileName?: string;
  documentType: 'MARK_SHEET' | 'DEGREE_CERT' | 'BONAFIDE' | 'INTERNSHIP' | 'ID_PROOF' | 'OTHER';
  encryptedFile: string;
  encryptedAESKey: string;
  hash: string;
  digitalSignature: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  remarks?: string;
  uploadedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface OTPSession {
  userId: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  resourceId: string;
  resourceType: string;
  timestamp: Date;
  details: Record<string, any>;
}

// In-memory storage for demonstration
export const users: Map<string, User> = new Map();
export const documents: Map<string, Document> = new Map();
export const otpSessions: Map<string, OTPSession> = new Map();
export const activityLogs: Array<ActivityLog> = [];

export const getUserByUsername = (username: string) => {
  for (const user of users.values()) {
    if (user.username === username) return user;
  }
  return null;
};

export const getUserByEmail = (email: string) => {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return null;
};

export const addActivityLog = (
  action: string,
  userId: string,
  resourceId: string,
  resourceType: string,
  details: Record<string, any> = {},
) => {
  activityLogs.push({
    id: Date.now().toString(),
    action,
    userId,
    resourceId,
    resourceType,
    timestamp: new Date(),
    details,
  });
};

export const getStudentDocuments = (studentId: string) => {
  const studentDocs: Document[] = [];
  for (const doc of documents.values()) {
    if (doc.studentId === studentId) {
      studentDocs.push(doc);
    }
  }
  return studentDocs;
};
