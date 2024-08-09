import { Request, Response } from 'express';
import * as express from 'express'

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req: Request, res: Response) => {
    res.sendStatus(200);
})

app.listen(port, () => {
    console.log(`Bot API is running under port ${port}`);
});

function registerRoute(route:string, Component:any):void {
    app.use(route, Component);
    console.log("Route registered: " + route);
}

export default {
    registerRoute
}