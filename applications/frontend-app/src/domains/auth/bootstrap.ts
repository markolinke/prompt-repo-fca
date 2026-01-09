import { AuthService } from './services/AuthService';
import { HttpAuthRepository } from './repositories/HttpAuthRepository';
import { createAuthStore } from './store/AuthStore';
import { LocalStorageTokenStorage } from './repositories/LocalStorageTokenRepository';
import authRoutes from './routes';
import { appDependencies } from "@/common/env/AppDependencies";
import { AxiosHttpClient } from '@/common/http/AxiosHttpClient';

const bootstrapAuth = () => {
    const appConfig = appDependencies.getAppConfig();
    const myRouter = appDependencies.getMyRouter();
    
    // Create token repository (localStorage implementation)
    const tokenRepository = new LocalStorageTokenStorage();
    
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
    const useStore = createAuthStore(authenticatedService, tokenRepository);
    
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

