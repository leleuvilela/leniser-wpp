import 'reflect-metadata';

import { Application } from './app';
import { Server } from './server';
import { container } from './ioc/inversify.config';
import { TYPES } from './ioc/types';

const app = container.get<Application>(TYPES.Application);

const server = new Server(app);

app.start();
server.start();
