import loadAllModules from "./loadAllModules"
import { IGraphQLInitialize } from "./../types/servers"
import { get } from "lodash"
import voyager from "./voyager/index"
import { defaultApolloGraphqlOptions } from "../defaults/options/index"
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json"
import { ApolloServer } from "apollo-server-express"
import * as auth from "./../helpers/auth"

export default async function (options: IGraphQLInitialize) {
  const {
    mailerInstance,
    configuration,
    models,
    sendEmail,
    emailTemplates,
    database,
    socketio,
    logger,
  } = options
  const apolloGraphqlOptions = get(
    configuration,
    "graphql.apolloGraphqlServerOptions",
    defaultApolloGraphqlOptions
  )
  let initializeContext = get(
    configuration,
    "context.initializeContext",
    async function () {}
  )
  initializeContext = await initializeContext("graphql", {
    models,
    database,
  })
  const modules = await loadAllModules(configuration)
  const graphqlVoyager = voyager(configuration)
  const apollo = new ApolloServer({
    typeDefs: modules.schema,
    resolvers: {
      ...modules.resolvers,
      JSON: GraphQLJSON,
      JSONObject: GraphQLJSONObject,
    },
    context: async ({ req, res, connection }) => {
      let cxt = {
        wertik: {
          database: database,
          auth: {
            helpers: auth,
          },
          models,
          sendEmail: sendEmail,
          emailTemplates: emailTemplates,
          mailerInstance: mailerInstance,
          req,
          res,
          socketio,
          logger,
          initializeContext: initializeContext,
          configuration: configuration,
        },
      }
      let requestContext = await get(
        configuration.context,
        "requestContext",
        () => {}
      )("graphql", cxt)
      cxt["requestContext"] = requestContext
      return cxt
    },
    ...apolloGraphqlOptions,
  })

  return {
    graphql: apollo,
    graphqlVoyager: graphqlVoyager,
  }
}
