import { AuthService } from './services/AuthService';
import { TokenService } from './services/TokenService';
import { HttpAuthRepository } from './repositories/HttpAuthRepository';
import { MockAuthRepository } from './repositories/MockAuthRepository';
import { createAuthStore } from './store/AuthStore';
import { LocalStorageTokenRepository } from './repositories/LocalStorageTokenRepository';
import { MockTokenRepository } from './repositories/MockTokenRepository';
import authRoutes from './routes';
import { appDependencies } from "@/common/env/AppDependencies";
import { AxiosHttpClient } from '@/common/http/AxiosHttpClient';

const bootstrapAuth = () => {
    const appConfig = appDependencies.getAppConfig();
    const repoType = appConfig.repositoryType;
    const baseHttpClient = appDependencies.getHttpClient();
    
    // Step 1: Token infrastructure (access token only)
    const tokenRepository = repoType === 'mock' 
        ? new MockTokenRepository() 
        : new LocalStorageTokenRepository();
    const tokenService = new TokenService(tokenRepository);
    
    // Step 2: Auth repository
    const authRepository = repoType === 'mock'
        ? new MockAuthRepository()
        : new HttpAuthRepository(baseHttpClient);
    
    // Step 3: Auth service
    const authService = new AuthService(authRepository);
    
    // Step 4: Token getter
    const tokenGetter = () => tokenService.getAccessToken();
    
    // Step 5: Register authenticated HTTP client (only in http mode)
    if (repoType === 'http') {
        const myRouter = appDependencies.getMyRouter();
        const authenticatedHttpClient = new AxiosHttpClient(
            appConfig.baseUrl,
            {},
            myRouter,
            tokenGetter
        );
        appDependencies.registerAuthenticatedHttpClient(authenticatedHttpClient);
    }
    
    // Step 6: Authenticated auth repository/service
    const authenticatedAuthRepository = repoType === 'mock'
        ? authRepository
        : new HttpAuthRepository(appDependencies.getAuthenticatedHttpClient());
    const authenticatedAuthService = repoType === 'mock'
        ? authService
        : new AuthService(authenticatedAuthRepository);
    
    // Step 7: Create store
    const useStore = createAuthStore(authenticatedAuthService, tokenService);
    
    return {
        useStore,
        routes: authRoutes,
        initializeAuth: () => {
            const store = useStore();
            store.initializeAuth();
        },
    };
};

export { bootstrapAuth };

