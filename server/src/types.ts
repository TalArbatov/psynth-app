
export interface Database<T> {
    tableName: string;
    create: (row: T) => Promise<T>;
    get: (whereClause?: { key: string; value: any }) => Promise<T[]>;
    find: (id: string) => Promise<T | null>;
    update: (id: string, row: Partial<T>) => Promise<void>;
    query: <R>(text: string, params: any[]) => Promise<R[]>;
}

export type Entity = {
    id: string;
};

export type SessionEntityType = Entity & {
    name: string;
    created_at: string;
};

export type ErrorResponse = {
    error: {
        code: string;
        message: string;
        requestId?: string;
        details?: unknown;
    };
};
