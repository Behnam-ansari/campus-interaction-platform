import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:3000/graphql"
  }),
  cache: new InMemoryCache()
});