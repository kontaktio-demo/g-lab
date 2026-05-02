import { Router, type Request, type Response, type NextFunction } from 'express';

/**
 * Wrapper na async handlery, żeby błędy automatycznie trafiały do `next()`.
 * Bez tego rzuty w `async` muszą być ręcznie łapane lub `unhandledRejection`.
 */
export const asyncHandler =
  <T = unknown>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const router = (): Router => Router({ mergeParams: true });
