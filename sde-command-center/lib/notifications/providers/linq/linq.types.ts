export type LinqRequest = {
  recipient?: string;
  message: string;
  title?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
};

export type LinqResponse = {
  success: boolean;
  id?: string;
  status?: string;
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
};
