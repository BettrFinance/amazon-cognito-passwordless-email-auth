// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
  Component,
  OnInit,
  OnDestroy,
  AfterContentInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef
} from "@angular/core";
import { Router } from "@angular/router";
import { FormControl } from "@angular/forms";
import { AuthService } from "../auth.service";
import { BehaviorSubject, Subscription } from "rxjs";
import { tap } from "rxjs/operators";

@Component({
  selector: "app-answer-challenge",
  templateUrl: "./answer-challenge.component.html",
  styleUrls: ["./answer-challenge.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnswerChallengeComponent
  implements OnInit, OnDestroy, AfterContentInit {
  digit1 = new FormControl("");
  digit2 = new FormControl("");
  digit3 = new FormControl("");
  digit4 = new FormControl("");
  digit5 = new FormControl("");
  digit6 = new FormControl("");
  @ViewChild("digit1el") digit1element: ElementRef;
  @ViewChild("digit2el") digit2element: ElementRef;
  @ViewChild("digit3el") digit3element: ElementRef;
  @ViewChild("digit4el") digit4element: ElementRef;
  @ViewChild("digit5el") digit5element: ElementRef;
  @ViewChild("digit6el") digit6element: ElementRef;

  private errorMessage_ = new BehaviorSubject("");
  public errorMessage = this.errorMessage_.asObservable();

  private busy_ = new BehaviorSubject(false);
  public busy = this.busy_.asObservable();

  private allSubscriptions = new Subscription();

  private email_ = new BehaviorSubject("");
  public email = this.email_.asObservable();

  private desc_ = new BehaviorSubject("");
  public desc = this.desc_.asObservable();

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Get e-mail address the code was sent to
    // It is a public challenge parameter so let's try it that way
    this.getChallengeDescription();

    this.auth.getChallengeName().then(name => {
      if (name == "passcode") {
        // this.desc_.next("please enter your gemalto passcode you configured");
        this.desc_.next("Please enter the login code");
      } else if (name == "provision") {
        this.desc_.next("Provision gemalto and enter OTP");
      }
    });

    this.auth
      .getPublicChallengeParameters()
      .then(param => this.email_.next(param.email));

    // Move focus to next field upon entry of a digit
    [2, 3, 4, 5, 6].forEach(digit => {
      const prev = this[`digit${digit - 1}`] as FormControl;
      const next = this[`digit${digit}element`] as ElementRef;
      this.allSubscriptions.add(
        prev.valueChanges
          .pipe(
            tap(() => {
              if (prev.value) {
                next.nativeElement.focus();
                next.nativeElement.setSelectionRange(0, 1);
              }
            })
          )
          .subscribe()
      );
    });

    // If the user copy pastes the code into the first digit field
    // we'll be so kind to cut it in 6 pieces and distribute it to the right fields
    this.allSubscriptions.add(
      this.digit1.valueChanges
        .pipe(
          tap(value => {
            if (value && value.length > 1) {
              const digits = value.split("").slice(0, 6);
              this.digit1.setValue(digits[0]);
              this.digit2.setValue(digits[1]);
              this.digit3.setValue(digits[2]);
              this.digit4.setValue(digits[3]);
              this.digit5.setValue(digits[4]);
              this.digit6.setValue(digits[5]);
            }
          })
        )
        .subscribe()
    );
  }

  getChallengeDescription() {
    this.auth.getChallengeName().then(name => {
      if (name == "passcode") {
        // this.desc_.next("please enter your gemalto passcode you configured");
        this.desc_.next(
          "Please enter the login code, this should be the pin defined by the user after provisioning"
        );
      } else if (name == "provision") {
        this.desc_.next(
          "Provision gemalto and enter OTP that was sent to your email"
        );
      }
    });
  }

  ngOnDestroy() {
    this.allSubscriptions.unsubscribe();
  }

  ngAfterContentInit() {
    this.digit1element.nativeElement.focus();
  }

  public async submit() {
    try {
      this.errorMessage_.next("");
      this.busy_.next(true);
      const answer = [1, 2, 3, 4, 5, 6]
        .map(digit => (this[`digit${digit}`] as FormControl).value)
        .join("");
      const user = await this.auth.answerCustomChallenge(answer);
      const loginSucceeded = await this.auth.isAuthenticated();
      console.log("answerCustomChallenge", user);

      if (user.challengeName === "CUSTOM_CHALLENGE") {
        this.getChallengeDescription();
      } else if (loginSucceeded) {
        this.router.navigate(["/private"]);
      } else {
        this.errorMessage_.next("That's not the right code");
      }
    } catch (err) {
      console.log("here", err);
      this.errorMessage_.next(err.message || err);
    } finally {
      this.busy_.next(false);
    }
  }
}
