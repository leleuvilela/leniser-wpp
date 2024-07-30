import { Router } from 'express';
import { IApplication } from '../application/contracts/IApplication';

class UpdateConfigsRoutes {
    public router: Router;
    private readonly application: IApplication;

    constructor(application: IApplication) {
        this.router = Router();
        this.application = application;
        this.intializeRoutes();
    }

    private intializeRoutes() {
        this.router.get('/', (req, res) => {
            this.application.updateConfigs();
            res.send('OK');
        });
    }
}

export { UpdateConfigsRoutes };
