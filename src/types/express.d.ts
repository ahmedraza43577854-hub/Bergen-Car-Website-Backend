declare global {
  namespace Express {
    interface Request {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validatedQuery?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validatedBody?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validatedParams?: any;
      dashboardEmail?: string;
    }
  }
}

export {};
