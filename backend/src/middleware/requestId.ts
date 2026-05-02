import { type Request, type Response, type NextFunction } from 'express';
import { nanoid } from 'nanoid';

const HEADER = 'x-request-id';

/**
 * Przechwytuje `X-Request-Id` z nagłówka albo generuje nowy.
 * Pino-http użyje go do korelacji logów (czyta `req.id`, które ustawiamy poniżej).
 *
 * Uwaga: nie augmentujemy typu `IncomingMessage.id`, bo pino-http robi to już
 * sam (typem `ReqId`). Castujemy lokalnie w miejscu zapisu.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(HEADER);
  const id = incoming && incoming.length <= 64 ? incoming : nanoid(12);
  (req as unknown as { id: string }).id = id;
  res.setHeader(HEADER, id);
  next();
}
