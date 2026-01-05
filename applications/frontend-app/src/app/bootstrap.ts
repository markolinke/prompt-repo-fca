// src/app/bootstrap.ts
import { Router } from 'vue-router'
import { bootstrapPrompts } from '@/domains/prompts'

export const bootstrapFeatures = (router: Router) : void => {   
    console.log('bootstrapFeatures, router: ', router);
    for (const route of bootstrapPrompts().routes) {
        console.log('bootstrapFeatures, adding route: ', route.name);
        router.addRoute(route);
    }
}
