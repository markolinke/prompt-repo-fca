import { PromptService } from './services/PromptService'
import { MockPromptRepository } from './repositories/MockPromptRepository'
import { HttpPromptRepository } from './repositories/HttpPromptRepository'
import { createPromptsStore } from './store/PromptsStore'
import promptsRoutes from './routes'
import { appDependencies } from "@/common/env/AppDependencies";
import { createDebouncer } from '@/common/time/Debouncer';

const bootstrapPrompts = () => {
    const useMocks = appDependencies.getAppConfig().isMockEnv

    const apiClient = appDependencies.getHttpClient();
    const timeoutClient = appDependencies.getTimeoutClient();
    const repository = useMocks
        ? new MockPromptRepository()
        : new HttpPromptRepository(apiClient)

    const service = new PromptService(repository)

    const createSearchDebouncer = () => {
        return createDebouncer(timeoutClient, 500);
    }
  
    return {
        useStore: createPromptsStore(service),
        routes: promptsRoutes,
        createSearchDebouncer
    }
}

export { bootstrapPrompts }