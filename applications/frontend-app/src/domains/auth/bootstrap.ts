import { AuthService } from './services/AuthService';
import { RefreshTokenService } from './services/RefreshTokenService';
import { TokenService } from './services/TokenService';
import { HttpAuthRepository } from './repositories/HttpAuthRepository';
import { createAuthStore } from './store/AuthStore';
import { LocalStorageTokenRepository } from './repositories/LocalStorageTokenRepository';
import { AuthenticatedHttpClient } from './services/AuthenticatedHttpClient';
import authRoutes from './routes';
import { appDependencies } from "@/common/env/AppDependencies";
import { AxiosHttpClient } from '@/common/http/AxiosHttpClient';
import { MockTokenRepository } from './repositories/MockTokenRepository';

const bootstrapAuth = () => {
    const appConfig = appDependencies.getAppConfig();
    const myRouter = appDependencies.getMyRouter();
    const repoType = appDependencies.getAppConfig().repositoryType;
    const baseHttpClient = appDependencies.getHttpClient(); // Base client (no auth)
    
    // Step 1: Token infrastructure (no dependencies)
    const tokenRepository = repoType === 'mock'
        ? new MockTokenRepository()
        : new LocalStorageTokenRepository();
    const tokenService = new TokenService(tokenRepository);
    
    // Step 2: Refresh infrastructure (uses base HTTP client - no auth needed!)
    // The refresh endpoint doesn't require access token, so we use base client
    const refreshRepository = new HttpAuthRepository(baseHttpClient);
    const refreshService = new RefreshTokenService(refreshRepository, tokenService);
    
    // Step 4: Store factory (store will be created lazily when useStore() is called after Pinia init)
    // We create it here but don't call it yet - it will be called lazily via closures
    let useStore: ReturnType<typeof createAuthStore> | undefined;
    
    // Step 5: Token getter (lazy - will call useStore when invoked, after Pinia is initialized)
    const tokenGetter = (): string | null => {
        if (!useStore) {
            return null;
        }
        const store = useStore();
        const getTokenFn = store.getToken;
        return getTokenFn();
    };
    
    // Step 6: Authenticated HTTP client (with token injection)
    const authenticatedHttpClient = new AxiosHttpClient(
        appConfig.baseUrl,
        {},
        myRouter,
        tokenGetter
    );
    
    // Step 7: Refresh callback (lazy - will call useStore when invoked, after Pinia is initialized)
    const refreshCallback = async (): Promise<boolean> => {
        const refreshed = await refreshService.refreshAccessToken();
        if (refreshed && useStore) {
            // Update store state from TokenService after successful refresh
            const store = useStore();
            const newAccessToken = tokenService.getAccessToken();
            const newRefreshToken = tokenService.getRefreshToken();
            if (newAccessToken && newRefreshToken) {
                store.setTokens(newAccessToken, newRefreshToken);
            }
        }
        return refreshed;
    };
    
    // Step 8: Wrap with automatic refresh handling
    const wrappedHttpClient = new AuthenticatedHttpClient(
        authenticatedHttpClient,
        refreshCallback
    );
    
    // Step 9: Authenticated repository/service (uses wrapped client)
    const authenticatedRepository = new HttpAuthRepository(wrappedHttpClient);
    const authenticatedService = new AuthService(authenticatedRepository);
    
    // Step 10: Now create the store factory (but still don't call it - that happens later after Pinia init)
    useStore = createAuthStore(authenticatedService, tokenService);
    
    return {
        useStore: useStore!, // Non-null assertion: useStore is assigned above
        routes: authRoutes,
        initializeAuth: () => {
            const store = useStore!();
            store.initializeAuth();
        },
    };
};

export { bootstrapAuth };

