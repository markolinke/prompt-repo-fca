import type { MyRouterPort } from "@/common/routing/MyRouterPort";

class AppDependencies {
    private myRouter: MyRouterPort | null = null

    registerMyRouter(router: MyRouterPort): void {
        this.myRouter = router
    }

    getMyRouter(): MyRouterPort {
        if (!this.myRouter) {
            throw new Error('MyRouter has not been registered. Make sure to call registerMyRouter() during app initialization.')
        }
        return this.myRouter
    }
}

export const appDependencies = new AppDependencies()
