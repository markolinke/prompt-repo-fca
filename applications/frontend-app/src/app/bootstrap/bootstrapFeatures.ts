// src/app/bootstrap.ts
import { Router } from 'vue-router'
import { bootstrapNotes } from '@/domains/notes'
import { bootstrapAuth } from '@/domains/auth'

export const bootstrapFeatures = (router: Router) => {   
    console.log('Bootstrapping features...')
    
    // Bootstrap notes
    for (const route of bootstrapNotes().routes) {
        console.log('bootstrapFeatures, adding route: ', route.name);
        router.addRoute(route);
    }
    
    // Bootstrap auth
    const authBootstrap = bootstrapAuth();
    for (const route of authBootstrap.routes) {
        console.log('bootstrapFeatures, adding auth route: ', route.name);
        router.addRoute(route);
    }
    
    console.log('Features bootstrapped successfully')
    
    // Return auth bootstrap for route guard setup
    return authBootstrap;
}
