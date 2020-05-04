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
        this.app.options('/:key', async (req, res) => {
            logger.Trace("OPTIONS");
            res.status(401).send();
        });

        this.app.get('/health', async (req, res) => {
            res.status(200).send({ health: "Ok" });
        });

        this.app.get('/:key', async (req, res) => {
            logger.Trace("GET");
            const keyName = req.params.key;
            const result = {};

            Object.keys(req.headers).forEach(key => {
                result[key] = req.headers[key];
            });

            Object.keys(req.query).forEach(key => {
                result[key] = req.query[key];
            });

            if (!keyName || !result[keyName]) {
                logger.Trace("log", result);

                if (req.headers["authorization"]) {
                    logger.Trace("Redirect");
                    res
                        .set(
                            {
                                'www-authenticate': 'Bearer authorization_uri=https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47/oauth2/authorize?client_id=2891fa56-d262-4d83-9510-96936c128941&response_mode=fragment&response_type=code+id_token&redirect_uri=https%3A%2F%2Frequest-echo.azurewebsites.net%2Fauthorize&scope=openid&nonce=12345'
                            }
                        )
                        .status(401).send();
                } else {
                    logger.Trace("Auth");
                    res
                        .set(
                            {
                                'content-type': 'application/json; odata.metadata=minimal',
                                'odata-version': '4.0',
                                'www-authenticate': 'Bearer realm=https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47'
                            }
                        )
                        .status(401).send();
                }
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