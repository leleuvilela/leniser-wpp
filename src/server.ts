import 'dotenv/config';
import express from 'express';
import { HealthCheckRoutes } from './routes/healthcheck';
import { type Application } from './app';

class Server {
    application: Application;
    private readonly app: express.Application;
    private readonly port: number;

    constructor(application: Application) {
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
        this.app.use('/updateConfigs', new HealthCheckRoutes().router);
    }
}

export { Server };
