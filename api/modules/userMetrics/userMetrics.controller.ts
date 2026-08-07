import { Request, Response, NextFunction } from "express";
import { MetricsPeriod } from "@replo/shared";
import { UserMetricsService } from "./userMetrics.service";
import { AuthenticatedRequest } from '../../types/auth';

const service = new UserMetricsService();

/** Read `?period=` from the query, defaulting to `week` for anything else. */
function parsePeriod(value: unknown): MetricsPeriod {
  return value === "month" ? "month" : "week";
}

export async function getPersonalBests(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    res.json(await service.getPersonalBests(authReq.user.id));
  } catch (err) {
    next(err);
  }
}

export async function getVolume(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    res.json(
      await service.getVolume(authReq.user.id, parsePeriod(req.query.period)),
    );
  } catch (err) {
    next(err);
  }
}

export async function getVolumeTrend(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    res.json(await service.getVolumeTrend(authReq.user.id));
  } catch (err) {
    next(err);
  }
}

export async function getMuscleBalance(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    res.json(
      await service.getMuscleBalance(
        authReq.user.id,
        parsePeriod(req.query.period),
      ),
    );
  } catch (err) {
    next(err);
  }
}
