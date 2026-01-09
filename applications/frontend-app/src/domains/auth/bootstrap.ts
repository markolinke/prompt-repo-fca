import { AuthService } from './services/AuthService';
import { TokenService } from './services/TokenService';
import { HttpAuthRepository } from './repositories/HttpAuthRepository';
import { createAuthStore } from './store/AuthStore';
import { LocalStorageTokenRepository } from './repositories/LocalStorageTokenRepository';
import authRoutes from './routes';
import { appDependencies } from "@/common/env/AppDependencies";
import { AxiosHttpClient } from '@/common/http/AxiosHttpClient';
import { MockTokenRepository } from './repositories/MockTokenRepository';

const bootstrapAuth = () => {
    const appConfig = appDependencies.getAppConfig();
    const myRouter = appDependencies.getMyRouter();
    const repoType = appDependencies.getAppConfig().repositoryType
    
    // Create token repository (localStorage implementation)
    const tokenRepository = repoType === 'mock'
        ? new MockTokenRepository()
        : new LocalStorageTokenRepository();
    
    // Create token service (application layer) - wraps repository
    const tokenService = new TokenService(tokenRepository);
            
    // Create authenticated HTTP client with token getter
    const authenticatedHttpClient = new AxiosHttpClient(
        appConfig.baseUrl,
        {},
        myRouter,
        () => {
            const store = useStore();
            const getTokenFn = store.getToken;
            return getTokenFn();
        }
    );
    
    // Create repository and service
    const authenticatedRepository = new HttpAuthRepository(authenticatedHttpClient);
    const authenticatedService = new AuthService(authenticatedRepository);
    
    // Create store with token repository
    const useStore = createAuthStore(authenticatedService, tokenService);
    
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

