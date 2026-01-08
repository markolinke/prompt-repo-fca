import { appDependencies } from "@/common/env/AppDependencies";
import type { AppConfig } from "@/common/env/AppDependencies";
import { MyRouter } from "../router/MyRouter";
import { AxiosHttpClient } from "@/common/http/AxiosHttpClient";
import { BrowserTimeout } from "@/common/time/timeout/BrowserTimeout";
import { Router } from 'vue-router'

export const bootstrapDependencies = (router: Router) : void => {
    console.log('Bootstrapping dependencies...')

    const appConfig : AppConfig= {
        baseUrl: import.meta.env.VITE_API_URL,
        repoType: import.meta.env.VITE_REPO_TYPE,
    }
    appDependencies.registerAppConfig(appConfig);

    const myRouter = new MyRouter(router);
    appDependencies.registerMyRouter(myRouter);

    const httpClient = new AxiosHttpClient(appConfig.baseUrl);
    appDependencies.registerHttpClient(httpClient);

    const timeoutClient = new BrowserTimeout();
    appDependencies.registerTimeoutClient(timeoutClient);

    console.log('Dependencies bootstrapped successfully')
}