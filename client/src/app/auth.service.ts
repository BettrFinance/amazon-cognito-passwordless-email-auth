// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Injectable, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Auth } from "aws-amplify";
import { CognitoUser } from "amazon-cognito-identity-js";
import { API } from "aws-amplify";

@Injectable({
  providedIn: "root",
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

  public async refreshSession() {
    const currentSession = await Auth.currentSession();
    console.log(currentSession);
    const refreshToekn = this.cognitoUser
      .getSignInUserSession()
      .getRefreshToken();
    this.cognitoUser.refreshSession(refreshToekn, (err, session) => {
      console.log("session", err, session);
    });
  }

  public async forgotPassword(email: string) {
    console.log("forgot password");
    this.cognitoUser = await Auth.signIn(email, null, {
      moo: "oi",
    });
    console.log(this.cognitoUser);

    // return await Auth.forgotPassword(email, {
    //   phone_number: "new number",
    // });

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
    console.log("trigger answerCustomChallenge");
    this.cognitoUser = await Auth.sendCustomChallengeAnswer(
      this.cognitoUser,
      answer
    );
    console.log("answerCustomChallenge", this.cognitoUser);
    return this.cognitoUser;
  }

  public async resendPin(phoneNumber: string = "") {
    console.log("trigger resendPin");
    this.cognitoUser = await Auth.sendCustomChallengeAnswer(
      this.cognitoUser,
      " ",
      {
        action: "resendPin",
        phoneNumber: phoneNumber,
      }
    );
    console.log("resendPin", this.cognitoUser);
    return this.cognitoUser;
  }

  public async getPublicChallengeParameters() {
    if (this.cognitoUser) {
      return this.cognitoUser.challengeParam;
    }

    return {
      email: "",
    };
  }

  public async signUp(email: string, fullName: string, phoneNumber: string) {
    let name = fullName.split(" ", 1)[0];
    let family_name = fullName.replace(`${name} `, "");

    const params = {
      username: email,
      password: this.getRandomString(30),
      attributes: {
        family_name: family_name,
        given_name: name,
        phone_number: phoneNumber,
      },
    };
    return await Auth.signUp(params);
  }

  public async confirmSignUp(user: CognitoUser, code: string) {
    const options = {};
    return await Auth.sendCustomChallengeAnswer(user, code, {
      step: "confirmSignUp",
    });
  }

  public async provisionUser() {
    // return API.post("BettrAPI", "/provision", {});÷
  }

  private getRandomString(bytes: number) {
    const randomValues = new Uint8Array(bytes);
    this.window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues).map(this.intToHex).join("");
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
