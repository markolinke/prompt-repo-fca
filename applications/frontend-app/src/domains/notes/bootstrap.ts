import { NoteService } from './services/NotesService'
import { MockNoteRepository } from './repositories/MockNotesRepository'
import { HttpNoteRepository } from './repositories/HttpNotesRepository'
import { createNotesStore } from './store/NotesStore'
import notesRoutes from './routes'
import { appDependencies } from "@/common/env/AppDependencies";
import { createDebouncer, createCurrentTimeProvider } from '@/common/time';

const bootstrapNotes = () => {
    const repoType = appDependencies.getAppConfig().repoType

    const apiClient = appDependencies.getHttpClient();
    const timeoutClient = appDependencies.getTimeoutClient();
    const repository = repoType === 'mock'
        ? new MockNoteRepository()
        : new HttpNoteRepository(apiClient)

    const service = new NoteService(repository)

    return {
        useStore: createNotesStore(service),
        routes: notesRoutes,
        createSearchDebouncer: () => createDebouncer(timeoutClient, 500),
        getCurrentTimeProvider: () => createCurrentTimeProvider(),
    }
}

export { bootstrapNotes }