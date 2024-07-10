import { gigById, gigsSearch } from '@auth/services/search.service';
import { IPaginateProps, ISearchResult } from '@quysterben/jobber-shared';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sortBy } from 'lodash';

export async function gigs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, size, type } = req.params;
    let resultHits: unknown[] = [];
    const paginate: IPaginateProps = { from, size: parseInt(`${size}`), type };
    const gigs: ISearchResult = await gigsSearch(
      `${req.query.query}`,
      paginate,
      `${req.query.delivery_time}`,
      parseInt(`${req.query.minPrice}`),
      parseInt(`${req.query.maxPrice}`)
    );
    for (const item of gigs.hits) {
      resultHits.push(item._source);
    }
    if (type === 'backward') {
      resultHits = sortBy(resultHits, ['sortId']);
    }
    res.status(StatusCodes.OK).json({
      message: 'Search gigs results',
      total: gigs.total,
      gigs: resultHits
    });
  } catch (error) {
    next(error);
  }
}

export async function singleGig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gig = await gigById('gigs', req.params.gigId);
    res.status(StatusCodes.OK).json({
      message: 'Gig details',
      gig
    });
  } catch (error) {
    next(error);
  }
}
