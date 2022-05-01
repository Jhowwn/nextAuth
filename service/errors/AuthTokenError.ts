export class AuthTokenError extends Error {
    constructor() {
        super('Error with authorization token.')
    }
}