// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Injectable, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Auth } from "aws-amplify";
import { CognitoUser } from "amazon-cognito-identity-js";
import { API } from "aws-amplify";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  public cognitoUser: CognitoUser & {
    challengeParam: { email: string };
    challengeName: string;
  };

  // Get access to window object in the Angular way
  private window: Window;
  constructor(@Inject(DOCUMENT) private document: Document) {
    this.window = this.document.defaultView;
  }

  public async signIn(email: string) {
    this.cognitoUser = await Auth.signIn(email);

    if (this.cognitoUser.challengeName === "CUSTOM_CHALLENGE") {
      // let params = this.getPublicChallengeParameters();
      let params = this.cognitoUser.challengeParam;

      // {
      //   customChallengeName: "PROVISIONING",
      //   registrationCode: akjsdhvfasdghf
      // }

      // {
      //   customChallengeName: "OTP",
      // }

      if (params["registrationCode"]) {
        console.log("provision with gemalto an navigate to OTP screen");
      }
    }

    return this.cognitoUser;
  }

  public async signOut() {
    await Auth.signOut();
  }

  public async getChallengeName() {
    let params = await this.getPublicChallengeParameters();
    return params["customChallengeName"] || "";
  }

  public async answerCustomChallenge(answer: string) {
    console.log("answerCustomChallenge");
    this.cognitoUser = await Auth.sendCustomChallengeAnswer(
      this.cognitoUser,
      answer
    );
    console.log("answerCustomChallenge", this.cognitoUser);
    return this.cognitoUser;
  }

  public async getPublicChallengeParameters() {
    return this.cognitoUser.challengeParam;
  }

  public async signUp(email: string, fullName: string, phoneNumber: string) {
    const params = {
      username: email,
      password: this.getRandomString(30),
      attributes: {
        name: fullName,
        phone_number: phoneNumber
      }
    };
    return await Auth.signUp(params);
  }

  public async confirmSignUp(user: CognitoUser, code: string) {
    const options = {};
    return await Auth.sendCustomChallengeAnswer(user, code, {
      step: "confirmSignUp"
    });
  }

  public async provisionUser() {
    // return API.post("BettrAPI", "/provision", {});÷
  }

  private getRandomString(bytes: number) {
    const randomValues = new Uint8Array(bytes);
    this.window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues)
      .map(this.intToHex)
      .join("");
  }

  private intToHex(nr: number) {
    return nr.toString(16).padStart(2, "0");
  }

  public async isAuthenticated() {
    try {
      await Auth.currentSession();
      return true;
    } catch {
      return false;
    }
  }

  public async getUserDetails() {
    if (!this.cognitoUser) {
      this.cognitoUser = await Auth.currentAuthenticatedUser();
    }
    return await Auth.userAttributes(this.cognitoUser);
  }
}
