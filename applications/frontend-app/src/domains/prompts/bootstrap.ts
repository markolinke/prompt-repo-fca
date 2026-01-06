import { PromptService } from './services/PromptService'
import { MockPromptRepository } from './repositories/MockPromptRepository'
import { HttpPromptRepository } from './repositories/HttpPromptRepository'
import { createPromptsStore } from './store/PromptsStore'
import promptsRoutes from './routes'
import { appDependencies } from "@/common/env/AppDependencies";

const bootstrapPrompts = () => {
    const useMocks = appDependencies.getAppConfig().isMockEnv

    const apiClient = appDependencies.getHttpClient();
    const repository = useMocks
        ? new MockPromptRepository()
        : new HttpPromptRepository(apiClient)

    const service = new PromptService(repository)
  
    return {
        useStore: createPromptsStore(service),
        routes: promptsRoutes
    }
}

export { bootstrapPrompts }