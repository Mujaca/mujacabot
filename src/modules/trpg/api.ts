import { Router, Request, Response } from 'express'
import { findCurrentWorld } from './manager/worldManager';

const router: Router = Router()

router.get('/', async (req: Request, res: Response) => {
    const world = await findCurrentWorld();
    
    res.status(200).send({
        isActive: world != null,
        world
    })
});

export default router;