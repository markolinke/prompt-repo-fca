import type { HttpClientPort } from "@/common/http/HttpClientPort";
import type { AuthRepositoryPort } from "./AuthRepositoryPort";
import { User } from "../entities/User";

export class HttpAuthRepository implements AuthRepositoryPort {
    constructor(private readonly httpClient: HttpClientPort) {}

    async getCurrentUser(): Promise<User> {
        const data = await this.httpClient.get('/auth/me');
        return User.fromPlainObject(data);
    }
}

