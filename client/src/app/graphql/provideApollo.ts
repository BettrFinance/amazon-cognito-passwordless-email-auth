import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { ApolloModule, Apollo, APOLLO_OPTIONS } from "apollo-angular";
import { HttpLinkModule, HttpLink } from "apollo-angular-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { Auth } from "aws-amplify";
import { setContext } from "apollo-link-context";
import aws4 from "aws4";

export function provideApollo(httpLink: HttpLink) {
  const auth = setContext(async (operation, context) => {
    const currentCredentials = await Auth.currentCredentials();

    const sessionToken = currentCredentials.sessionToken;
    console.log(currentCredentials);
    console.log(sessionToken);
    // operation.context;
    // const options = {};
    // const signable = {};
    // const urlObject = url.parse(uri);
    // signable.host = urlObject.host;
    // signable.path = urlObject.path;
    // ["method", "body", "headers", "region", "service"].forEach(
    //   key => (signable[key] = options[key])
    // );

    // const credentials = {
    //   secretAccessKey: currentCredentials.secretAccessKey,
    //   accessKeyId: currentCredentials.accessKeyId,
    //   sessionToken: currentCredentials.sessionToken
    // };
    // aws4.sign(signable, credentials);
    // return {
    //   headers: signable.headers
    // };

    // console.log(currentCredentials);
    // console.log(currentCredentials.sessionToken);

    try {
      const session = await Auth.currentSession();
      const idToken = session.getIdToken();
      const response = {
        headers: {
          Authorization: idToken.getJwtToken()
        }
      };
      console.log(response);

      return response;
    } catch (e) {
      console.error(e);
      const currentCredentials = await Auth.currentCredentials();

      const sessionToken = currentCredentials.sessionToken;
      return {
        headers: {
          Authorization: sessionToken
        }
      };
    }
  });

  const link = ApolloLink.from([
    auth,
    httpLink.create({
      uri: "https://qiv3c39hsg.execute-api.eu-west-1.amazonaws.com/dev/graphql"
    })
  ]);
  const cache = new InMemoryCache();

  return {
    link,
    cache
  };
}
