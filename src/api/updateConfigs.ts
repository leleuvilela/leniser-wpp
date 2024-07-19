import { Router } from "express";
import { Application } from "../app";

class updateConfigsRoutes {
    public router: Router;
    private readonly application: Application;

    constructor(application: Application) {
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

export { updateConfigsRoutes };