import * as express from 'express';
import { Telemetry } from 'meeteric-ts';
import logger = Telemetry.Logger;

class ExpressApp {
    private readonly app: any;

    constructor() {
        Telemetry.Configuration.Initialize();
        this.app = express();
    }

    public ConfigureAndRun() {
        this.app.get('/health', async (req, res) => {
            res.status(200).send({ health: "Ok" });
        });

        this.app.get('/:key', async (req, res) => {
            const keyName = req.params.key;
            const result = {};

            Object.keys(req.headers).forEach(key => {
                result[key] = req.headers[key];
            });

            Object.keys(req.query).forEach(key => {
                result[key] = req.query[key];
            });

            if (!keyName || !result[keyName]) {
                res.status(401).send();
                return;
            }

            res
                .set({
                    'Content-Type': 'application/json'
                })
                .status(200)
                .send(result);
        });

        const port = process.env.PORT || 3000;
        this.app.listen(port, () => {
            logger.Trace("Express server listening on port " + port);
        });
    }
}

new ExpressApp().ConfigureAndRun();