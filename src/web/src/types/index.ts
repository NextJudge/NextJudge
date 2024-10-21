export interface User {
  id: number;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  joinDate: Date;
}

export interface Problem {
  id: number;
  prompt: string;
  title: string;
  timeout: number;
  userId: number;
  uploadDate: Date;
  testCases: TestCase[];
}

export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
}

export interface Competition {
  id: number;
  userId: number;
  startTime: Date;
  endTime: Date;
  description: string;
  title: string;
  problems: Problem[];
  participants: User[];
}

export type Contest = Competition;

export type Theme = {
  name: string;
  fetch: string;
};

export interface NewsletterFormValues {
  name: string;
  email: string;
}

export interface SignUpFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export interface SignUpCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export interface SignoutCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
