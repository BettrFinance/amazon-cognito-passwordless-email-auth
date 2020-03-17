// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { AuthService } from "../auth.service";
import { BehaviorSubject } from "rxjs";
import { FormGroup, FormControl } from "@angular/forms";
import { Apollo } from "apollo-angular";
import gql from "graphql-tag";
import { API } from "aws-amplify";

@Component({
  selector: "app-private",
  templateUrl: "./private.component.html",
  styleUrls: ["./private.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivateComponent implements OnInit {
  private userDetails_: BehaviorSubject<any[]> = new BehaviorSubject(undefined);
  public userDetails = this.userDetails_.asObservable();
  public userDetailsForm = new FormGroup({});

  private busy_ = new BehaviorSubject(false);
  public busy = this.busy_.asObservable();

  private errorMessage_ = new BehaviorSubject("");
  public errorMessage = this.errorMessage_.asObservable();

  private graphql_ping_ = new BehaviorSubject("");
  public graphql_ping = this.graphql_ping_.asObservable();

  private api_status_ = new BehaviorSubject("");
  public api_status = this.api_status_.asObservable();

  constructor(private auth: AuthService, private apollo: Apollo) {}

  ngOnInit() {
    this.getUserDetails();
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
          this.errorMessage_.next(result.errors[0].message);
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

        this.errorMessage_.next(error.response || error);
      });
  }

  public async getUserDetails() {
    this.busy_.next(true);
    this.errorMessage_.next("");
    try {
      const userDetails = await this.auth.getUserDetails();
      userDetails.forEach(detail => {
        const control = new FormControl(detail.getValue());
        this.userDetailsForm.addControl(detail.getName(), control);
      });
      this.userDetails_.next(userDetails);
    } catch (err) {
      this.errorMessage_.next(err.message || err);
    } finally {
      this.busy_.next(false);
    }
  }
}
