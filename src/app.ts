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
            var baseUri = req.protocol + '://' + req.get('host');
            var fullUrl =  baseUri + req.originalUrl;
            logger.Trace("GET, req="+fullUrl);
            const keyName = req.params.key;
            const result = {};
            const resultOdata = {"odata.metadata": baseUri + "/metadata","value":[{"name": "Categories","url": "Categories"}]};

            const resultMetdata = "<?xml version=\"1.0\" encoding=\"utf-8\"?><edmx:Edmx Version=\"1.0\" xmlns:edmx=\"http://schemas.microsoft.com/ado/2007/06/edmx\"><edmx:DataServices m:DataServiceVersion=\"1.0\" m:MaxDataServiceVersion=\"3.0\" xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\"><Schema Namespace=\"NorthwindModel\" xmlns=\"http://schemas.microsoft.com/ado/2008/09/edm\"><EntityType Name=\"Category\"><Key><PropertyRef Name=\"CategoryID\" /></Key><Property Name=\"CategoryID\" Type=\"Edm.Int32\" Nullable=\"false\" p6:StoreGeneratedPattern=\"Identity\" xmlns:p6=\"http://schemas.microsoft.com/ado/2009/02/edm/annotation\" /><Property Name=\"CategoryName\" Type=\"Edm.String\" Nullable=\"false\" MaxLength=\"15\" FixedLength=\"false\" Unicode=\"true\" /><Property Name=\"Description\" Type=\"Edm.String\" MaxLength=\"Max\" FixedLength=\"false\" Unicode=\"true\" /><Property Name=\"Picture\" Type=\"Edm.Binary\" MaxLength=\"Max\" FixedLength=\"false\" /><NavigationProperty Name=\"Products\" Relationship=\"NorthwindModel.FK_Products_Categories\" ToRole=\"Products\" FromRole=\"Categories\" /></EntityType></Schema><Schema Namespace=\"ODataWebV3.Northwind.Model\" xmlns=\"http://schemas.microsoft.com/ado/2008/09/edm\"><EntityContainer Name=\"NorthwindEntities\" m:IsDefaultEntityContainer=\"true\" p6:LazyLoadingEnabled=\"true\" xmlns:p6=\"http://schemas.microsoft.com/ado/2009/02/edm/annotation\"><EntitySet Name=\"Categories\" EntityType=\"NorthwindModel.Category\" /></EntityContainer></Schema></edmx:DataServices></edmx:Edmx>";
            
            Object.keys(req.headers).forEach(key => {
                result[key] = req.headers[key];
            });

            Object.keys(req.query).forEach(key => {
                result[key] = req.query[key];
            });            

            if (!keyName || !result[keyName]) {
                logger.Trace("log", result);

                if(keyName == "metadata")
                {
                    logger.Trace("Metadata");
                    res
                                .set({
                                    'Content-Type': 'application/xml;charset=utf-8'
                                })
                                .status(200)
                            .send(resultMetdata);
                            return;
                }

                const authHeaderValue = req.headers["authorization"];
                if (authHeaderValue) {
                    if (authHeaderValue == "Bearer")
                    {
                        logger.Trace("Redirect");
                        res
                          .set(
                                {
                                      'www-authenticate': 'Bearer authorization_uri=https://login.microsoftonline.com/5ed6c90c-d2d3-4f71-8a51-b595acd4407c/oauth2/authorize?client_id=770476af-adf3-400d-8476-a98fb89f1405&response_mode=fragment&response_type=code+id_token&redirect_uri=https%3A%2F%2Flocalhost%3A3111%2Ftesting%2Fauthorize&scope=openid&nonce=12345'
                                }
                            )
                            .status(401).send();
                    }
                    else{
                        logger.Trace("Odata");
                        res
                            .set({
                                'Content-Type': 'application/json;odata=minimalmetadata;streaming=true;charset=utf-8'
                            })
                            .status(200)
                        .send(resultOdata);

                        logger.Trace("returned="+JSON.stringify(resultOdata));
                    }                        
                } else {
                    logger.Trace("Auth");
                    res
                        .set(
                            {
                                'www-authenticate': 'Bearer realm=https://login.microsoftonline.com/5ed6c90c-d2d3-4f71-8a51-b595acd4407c'
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

        const port = process.env.PORT || 3111;
        this.app.listen(port, () => {
            logger.Trace("Express server listening on port " + port);
        });
    }
}

new ExpressApp().ConfigureAndRun();