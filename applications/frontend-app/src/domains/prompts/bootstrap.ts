import { PromptService } from './services/PromptService'
import { MockPromptRepository } from './repositories/MockPromptRepository'
import { HttpPromptRepository } from './repositories/HttpPromptRepository'
import { createPromptsStore } from './store/PromptsStore'
import promptsRoutes from './routes'
import { appDependencies } from "@/common/env/AppDependencies";
import type { TimeoutHandle } from '@/common/time/TimeoutPort';

const bootstrapPrompts = () => {
    const useMocks = appDependencies.getAppConfig().isMockEnv

    const apiClient = appDependencies.getHttpClient();
    const timeoutClient = appDependencies.getTimeoutClient();
    const repository = useMocks
        ? new MockPromptRepository()
        : new HttpPromptRepository(apiClient)

    const service = new PromptService(repository)

    const createSearchDebouncer = () => {
        let handle: TimeoutHandle | null = null

        return (callback: () => void) => {
            if (handle !== null) {
                timeoutClient.clearTimeout(handle)
            }

            handle = timeoutClient.setTimeout(() => {
                callback()
                handle = null
            }, 500)
        }
    }
  
    return {
        useStore: createPromptsStore(service),
        routes: promptsRoutes,
        createSearchDebouncer
    }
}

export { bootstrapPrompts }