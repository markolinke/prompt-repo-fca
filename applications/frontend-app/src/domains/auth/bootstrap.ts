import { AuthService } from './services/AuthService';
import { HttpAuthRepository } from './repositories/HttpAuthRepository';
import { createAuthStore } from './store/AuthStore';
import authRoutes from './routes';
import { appDependencies } from "@/common/env/AppDependencies";
import { AxiosHttpClient } from '@/common/http/AxiosHttpClient';

const bootstrapAuth = () => {
    const appConfig = appDependencies.getAppConfig();
    const myRouter = appDependencies.getMyRouter();
    const baseHttpClient = appDependencies.getHttpClient();
    
    // Create repository, service, and store
    const repository = new HttpAuthRepository(baseHttpClient);
    const service = new AuthService(repository);
    const useStore = createAuthStore(service);
    
    // Create authenticated client (will be used if repository needs it later)
    // For Phase 2, base client works since backend mock doesn't require tokens
    // Store provides token getter for future use in Phase 3
    const authenticatedHttpClient = new AxiosHttpClient(
        appConfig.baseUrl,
        {},
        myRouter,
        () => useStore().getToken()
    );
    
    // Create authenticated repository (ready for Phase 3 when tokens are required)
    const authenticatedRepository = new HttpAuthRepository(authenticatedHttpClient);
    const authenticatedService = new AuthService(authenticatedRepository);
    const authenticatedStore = createAuthStore(authenticatedService);
    
    return {
        useStore: authenticatedStore,
        routes: authRoutes,
    };
};

export { bootstrapAuth };

