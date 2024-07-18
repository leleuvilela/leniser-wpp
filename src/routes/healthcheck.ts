import { Router } from "express";

class HealthCheckRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.intializeRoutes();
    }

    private intializeRoutes() {
        this.router.get('/', (req, res) => {
            res.send('OK');
        });
    }
}

export { HealthCheckRoutes };
