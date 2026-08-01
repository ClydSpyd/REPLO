import { Request, Response, NextFunction } from "express";
import { UserMetricsService } from "./userMetrics.service";
import { AuthenticatedRequest } from '../../types/auth';

const service = new UserMetricsService();

export async function createMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const metrics = await service.createMetrics({
      ...req.body,
      userId: authReq.user.id,
    });
    res.status(201).json(metrics);
  } catch (err) {
    next(err);
  }
}

export async function getLatestMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const metrics = await service.getLatestMetrics(authReq.user.id);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
}

export async function getMetricsHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const history = await service.getMetricsHistory(authReq.user.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

export async function updateMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const metrics = await service.updateMetrics(
      req.params.id as string,
      req.body,
    );
    res.json(metrics);
  } catch (err) {
    next(err);
  }
}
