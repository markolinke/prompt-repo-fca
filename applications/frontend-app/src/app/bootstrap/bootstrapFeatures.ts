// src/app/bootstrap.ts
import { Router } from 'vue-router'
import { bootstrapNotes } from '@/domains/notes'

export const bootstrapFeatures = (router: Router) : void => {   
    console.log('Bootstrapping features...')
    for (const route of bootstrapNotes().routes) {
        console.log('bootstrapFeatures, adding route: ', route.name);
        router.addRoute(route);
    }
    console.log('Features bootstrapped successfully')
}
