
export interface MyRouterPort {
    navigateTo(route: object): void;
    navigateToError(error: Error): void;
}