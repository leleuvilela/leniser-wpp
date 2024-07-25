import 'dotenv/config';
import express from 'express';
import { HealthCheckRoutes } from './api/healthcheck';
import { UpdateConfigsRoutes } from './api/updateConfigs';
import { IApplication } from './application/contracts/IApplication';

class Server {
    application: IApplication;
    private readonly app: express.Application;
    private readonly port: number;

    constructor(application: IApplication) {
        this.application = application;
        this.app = express();
        this.port = Number(process.env.PORT) || 3000;
        this.routes();
    }

    public start() {
        this.app.get('/healthcheck', (req, res) => {
            res.send('OK');
        });

        this.app.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
        });
    }

    private routes() {
        this.app.use('/healthcheck', new HealthCheckRoutes().router);
        this.app.use('/updateConfigs', new UpdateConfigsRoutes(this.application).router);
    }
}

export { Server };
