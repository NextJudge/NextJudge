export interface Submission {
  submissionId: string;
  code: string;
  lang: string;
  problemId: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  join_date: string;
}

export type UserValidationResult = {
  user: User | null;
  isCorrectUser: boolean;
};

export type ApiResponse = User[];
