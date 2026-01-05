// src/app/bootstrap.ts
import { Router } from 'vue-router'
import { bootstrapPrompts } from '@/domains/prompts'

export const bootstrapFeatures = (router: Router) : void => {   
    for (const route of bootstrapPrompts().routes) {
        router.addRoute(route);
    }
}
