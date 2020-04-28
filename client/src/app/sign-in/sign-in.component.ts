// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Component, ChangeDetectionStrategy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FormControl } from "@angular/forms";
import { AuthService } from "../auth.service";
import { BehaviorSubject } from "rxjs";
import { Apollo } from "apollo-angular";
import gql from "graphql-tag";
import { API } from "aws-amplify";

@Component({
  selector: "app-sign-in",
  templateUrl: "./sign-in.component.html",
  styleUrls: ["./sign-in.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInComponent implements OnInit {
  public email = new FormControl("");

  private busy_ = new BehaviorSubject(false);
  public busy = this.busy_.asObservable();

  private errorMessage_ = new BehaviorSubject("");
  public errorMessage = this.errorMessage_.asObservable();

  private graphql_ping_ = new BehaviorSubject("");
  public graphql_ping = this.graphql_ping_.asObservable();

  private api_status_ = new BehaviorSubject("");
  public api_status = this.api_status_.asObservable();

  constructor(
    private router: Router,
    private auth: AuthService,
    private apollo: Apollo
  ) {}

  ngOnInit() {
    this.apollo
      .watchQuery({
        query: gql`
          {
            ping
          }
        `
      })
      .valueChanges.subscribe(result => {
        console.log(result);
        this.graphql_ping_.next(result.data && result.data["ping"]);
        if (result.errors) {
          this.graphql_ping_.next(result.errors[0].message);
        }
      });

    API.get("BettrAPI", "/status", {
      response: true
    })
      .then(response => {
        console.log(response);
        this.api_status_.next("status");
      })
      .catch(error => {
        console.error(error.response || error);

        this.api_status_.next(error.response || error);
      });
  }

  public async signIn() {
    this.busy_.next(true);
    this.errorMessage_.next("");
    try {
      let user = await this.auth.signIn(this.email.value);
      console.log(user);
      this.router.navigate(["/enter-secret-code"]);
    } catch (err) {
      this.errorMessage_.next(err.message || err);
    } finally {
      this.busy_.next(false);
    }
  }

  public async forgotPassword() {
    this.busy_.next(true);
    this.errorMessage_.next("");
    try {
      let user = await this.auth.forgotPassword(this.email.value);
      console.log(user);
      if (user.challengeName === "CUSTOM_CHALLENGE") {
        this.router.navigate(["/enter-secret-code"]);
      }
    } catch (err) {
      this.errorMessage_.next(err.message || err);
    } finally {
      this.busy_.next(false);
    }
  }
}
