import { PromptService } from './services/PromptService'
import { MockPromptRepository } from './repositories/MockPromptRepository'
import { HttpPromptRepository } from './repositories/HttpPromptRepository'
import { ApiClient } from '@/common/http/HttpClient'
import { appConfig } from '@/common/env/AppConfig'
import { createPromptsStore } from './store/PromptsStore'
import promptsRoutes from './routes'

const bootstrapPrompts = () => {
    const useMocks = appConfig.isMockEnv

    const apiClient = new ApiClient(appConfig.baseUrl);
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