export type ToolResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
