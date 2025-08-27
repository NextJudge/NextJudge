import { CreateTestCaseRequest } from "@/lib/types";

export type Theme = {
  name: string;
  fetch: string;
};

export interface NewsletterFormValues {
  name: string;
  email: string;
}

export interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface ProblemFormValues {
  title: string;
  identifier: string;
  prompt: string;
  source: string;
  difficulty: "VERY EASY" | "EASY" | "MEDIUM" | "HARD" | "VERY HARD";
  timeout: number;
  accept_timeout?: number;
  execution_timeout?: number;
  memory_limit?: number;
  user_id: string;
  test_cases: CreateTestCaseRequest[];
  category_ids: string[];
  public: boolean;
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
