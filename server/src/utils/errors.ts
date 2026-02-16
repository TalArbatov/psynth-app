export class AppError extends Error {
    readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(400, message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(404, message);
        this.name = 'NotFoundError';
    }
}
