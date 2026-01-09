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
            
    // Create a token getter function that will reference the store
    let tokenGetter: (() => string | null) | undefined;
    
    // Create authenticated HTTP client with token getter
    const authenticatedHttpClient = new AxiosHttpClient(
        appConfig.baseUrl,
        {},
        myRouter,
        () => tokenGetter?.() || null
    );
    
    // Create repository and service
    const authenticatedRepository = new HttpAuthRepository(authenticatedHttpClient);
    const authenticatedService = new AuthService(authenticatedRepository);
    
    // Create store with token repository
    const useStore = createAuthStore(authenticatedService, tokenService);
    
    // Set the token getter after store is created
    // getToken is a getter that returns a function, so we access it directly
    const store = useStore();
    tokenGetter = () => {
        const getTokenFn = store.getToken;
        return getTokenFn();
    };
    
    return {
        useStore,
        routes: authRoutes,
        initializeAuth: () => {
            store.initializeAuth();
        },
    };
};

export { bootstrapAuth };

