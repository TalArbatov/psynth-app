import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fastifyStatic from "@fastify/static";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import path from "path";
import { LocalAppProfile } from "./app-profile/local-app-profile";
import { Config } from "./config";
import { routes } from "./utils/routes";
import * as requestHandlers from "./request-handlers/index";
import { AppProfile } from "./app-profile/app-profile";
import { errorHandlerPlugin } from "./plugins/error-handler";
import { websocketPlugin } from "./plugins/websocket";

declare module "fastify" {
    interface FastifyRequest {
        appProfile: AppProfile;
    }
}

const registerRequestHandlers = (app: FastifyInstance) => {
    app.get(routes.heartbeat, (_: FastifyRequest, res: FastifyReply) => { res.send(1) });

    app.post(routes.session.create, requestHandlers.createSessionHandler);

    app.get(routes.session.find, requestHandlers.findSessionHandler);
};

const registerAppProfile = (app: FastifyInstance, appProfile: AppProfile): void => {
    app.decorateRequest('appProfile', {
        getter() {
            return appProfile;
        }
    });
};

const registerPlugins = async (app: FastifyInstance): Promise<void> => {
    await app.register(cors, {
        origin: (origin, cb) => {
            // allow non-browser tools (curl/postman) that send no Origin
            if (!origin) return cb(null, true);

            // allow localhost and production domains
            if (
                /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
                /^https?:\/\/([a-z0-9-]+\.)?talarbetov\.com(:\d+)?$/.test(origin)
            ) {
                return cb(null, true);
            }

            cb(new Error("Not allowed by CORS"), false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });

    await app.register(sensible);

    await app.register(errorHandlerPlugin);

    await app.register(websocketPlugin);

    const clientDir = Config.get('web-server.clientDir') || '../client/dist';
    const staticRoot = path.resolve(__dirname, '..', '..', clientDir);

    await app.register(fastifyStatic, {
        root: staticRoot,
    });

    // SPA fallback: serve index.html for non-API, non-WS routes
    app.setNotFoundHandler(async (request, reply) => {
        // Only serve SPA fallback for GET requests that look like page navigation
        if (request.method === 'GET' && !request.url.startsWith('/session') && !request.url.startsWith('/heartbeat') && !request.url.startsWith('/ws')) {
            return reply.sendFile('index.html');
        }

        return reply.status(404).send({
            error: {
                code: "NOT_FOUND",
                message: `Route ${request.method} ${request.url} not found`,
                requestId: request.id,
            },
        });
    });
};

const createServer = async (): Promise<FastifyInstance> => {
    const app = Fastify({ logger: true });

    const config = { pgPool: Config.getPostgresPool() };

    const appProfile = new LocalAppProfile(config);

    registerAppProfile(app, appProfile);

    await registerPlugins(app);

    registerRequestHandlers(app);

    return app;
};

export { createServer };
