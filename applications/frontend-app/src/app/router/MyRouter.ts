import { MyRouterPort } from "@/common/routing/MyRouterPort";
import { RouteLocationRaw, useRouter } from "vue-router";

const router = useRouter();

export class MyRouter implements MyRouterPort {
    navigateTo(route: object): void {
        const routeLocation: RouteLocationRaw = route as RouteLocationRaw;
        router.push(routeLocation);
    }

    navigateToError(error: Error): void {
        router.push({ name: 'Error', params: { name: error.name, message: error.message } });
    }
}
