// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

import Amplify from "aws-amplify";

if (environment.production) {
  enableProdMode();
}

Amplify.configure({
  Auth: {
    region: environment.region,
    userPoolId: environment.userPoolId,
    userPoolWebClientId: environment.userPoolWebClientId,
    identityPoolId: environment.identityPoolId
    // authenticationFlowType: "CUSTOM_AUTH"
  },
  API: {
    endpoints: [
      {
        name: "BettrAPI",
        endpoint: "https://qiv3c39hsg.execute-api.eu-west-1.amazonaws.com/dev",
        region: "eu-west-1"
      }
    ]
  }
});

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
