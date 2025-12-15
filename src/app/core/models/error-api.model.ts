export type ErrorApi = {
  error: {
    error: string;
    message: string;
  };
  headers: Record<string, string>;
  message: string;
  name: string;
  ok: boolean;
  redirected: boolean;
  status: number;
  statusText: string;
  type?: string;
  url: string;
};
