import { NoteService } from './services/NotesService'
import { MockNoteRepository } from './repositories/MockNotesRepository'
import { HttpNoteRepository } from './repositories/HttpNotesRepository'
import { createNotesStore } from './store/NotesStore'
import notesRoutes from './routes'
import { appDependencies } from "@/common/env/AppDependencies";
import { createDebouncer } from '@/common/time/Debouncer';

const bootstrapNotes = () => {
    const useMocks = appDependencies.getAppConfig().isMockEnv

    const apiClient = appDependencies.getHttpClient();
    const timeoutClient = appDependencies.getTimeoutClient();
    const repository = useMocks
        ? new MockNoteRepository()
        : new HttpNoteRepository(apiClient)

    const service = new NoteService(repository)

    const createSearchDebouncer = () => {
        return createDebouncer(timeoutClient, 500);
    }
  
    return {
        useStore: createNotesStore(service),
        routes: notesRoutes,
        createSearchDebouncer
    }
}

export { bootstrapNotes }