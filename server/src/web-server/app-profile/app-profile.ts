import { SessionEntityGateway } from "../../app/ports/session-entity-gateway";
import { PostgresqlDB } from "../../data-persistence/postgresql";
import { Pool } from 'pg';
import { SessionEntityType } from "../../types";
import { SessionPostgresEntityGateway } from "../../adapters/postgres-gateways/session-postgres-entity-gateway";
import { CreateSessionUseCase } from "../../app/use-cases/create-session-use-case";
import { FindSessionUseCase } from "../../app/use-cases/find-session-use-case";

type Config = {
    pgPool: Pool;
};

abstract class AppProfile {
    private readonly pgPool: Pool;

    public constructor(config: Config) {
        this.pgPool = config.pgPool;
    }

    public getSessionEntityGateway(): SessionEntityGateway {
        const postgresqlDb = new PostgresqlDB<SessionEntityType>(this.pgPool, "sessions");

        return new SessionPostgresEntityGateway(postgresqlDb);
    }

    public getCreateSessionUseCase(): CreateSessionUseCase {
        return new CreateSessionUseCase(this.getSessionEntityGateway());
    }

    public getFindSessionUseCase(): FindSessionUseCase {
        return new FindSessionUseCase(this.getSessionEntityGateway());
    }
}

export { AppProfile };
