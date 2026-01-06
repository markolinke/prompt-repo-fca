import { MyRouterPort } from "@/common/routing/MyRouterPort";
import { RouteLocationRaw, Router } from "vue-router";

export class MyRouter implements MyRouterPort {
    constructor(private readonly router: Router) {}

    navigateTo(route: object): void {
        const routeLocation: RouteLocationRaw = route as RouteLocationRaw;
        this.router.push(routeLocation);
    }

    navigateToError(error: Error): void {
        this.router.push({ name: 'Error', params: { name: error.name, message: error.message } });
    }
}
