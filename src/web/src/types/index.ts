
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
