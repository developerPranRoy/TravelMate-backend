import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';
import * as destinationService from './destination.service';
import type { CreateDestinationInput, UpdateDestinationInput, DestinationQuery } from './destination.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as DestinationQuery;
    const { destinations, total, page, limit } = await destinationService.getDestinations(query);
    sendPaginated(res, destinations, total, page, limit, 'Destinations retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const destination = await destinationService.getDestinationById(String(req.params.id));
    sendSuccess(res, destination, 'Destination retrieved');
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreateDestinationInput;
    const destination = await destinationService.createDestination(data);
    sendCreated(res, destination, 'Destination created');
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as UpdateDestinationInput;
    const destination = await destinationService.updateDestination(String(req.params.id), data);
    sendSuccess(res, destination, 'Destination updated');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await destinationService.deleteDestination(String(req.params.id));
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}
