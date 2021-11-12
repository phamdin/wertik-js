import { get, omit } from "lodash";
import { defaultApolloGraphqlOptions } from "../../framework/defaults/options";
import { ApolloServer } from "apollo-server-express";
import { GraphqlInitializeProps } from "../types/types.v2";

export const useGraphql = (obj?) => obj ?? {};

export default function ({
  wertikApp,
  expressApp,
  store,
  configuration,
}: GraphqlInitializeProps) {
  store.graphql.typeDefs = store.graphql.typeDefs.concat(
    get(configuration, "graphql.typeDefs", "")
  );

  store.graphql.resolvers.Query = {
    ...store.graphql.resolvers.Query,
    ...get(configuration, "graphql.resolvers.Query", {}),
  };

  store.graphql.resolvers.Mutation = {
    ...store.graphql.resolvers.Mutation,
    ...get(configuration, "graphql.resolvers.Mutation", {}),
  };

  const options = { ...get(configuration, "graphql.options", {}) };

  const GraphqlApolloServer = new ApolloServer({
    typeDefs: store.graphql.typeDefs,
    resolvers: {
      ...store.graphql.resolvers,
    },
    ...defaultApolloGraphqlOptions,
    ...omit(options, ["context"]),
    context: async () => {
      let contextFromOptions = await get(options, "context", function () {})();

      return {
        wertik: wertikApp,
        ...contextFromOptions,
      };
    },
  });

  GraphqlApolloServer.applyMiddleware({ app: expressApp });

  return GraphqlApolloServer;
}
