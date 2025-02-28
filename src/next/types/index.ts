import { Sequelize } from "sequelize/types"
import { useDatabaseProps } from "./database"

export type iObject = { [key: string]: any }

export interface Store {
  graphql: {
    typeDefs: String
    resolvers: {
      Query: {
        [key: string]: Function
      }
      Mutation: {
        [key: string]: Function
      }
    }
  }
  database: {
    relationships: Array<iObject>
  }
}

export interface WertikConfiguration {
  /**
   * App environment, production,
   */
  appEnv?: "production" | "development" | "local"

  /**
   * Port number on which your will run.
   */
  port?: number
  /**
   * [Optional] If you have already created express app. You can pass here.
   */
  express?: any
  /**
   * [Optional] If you have already created httpServer. You can pass here.
   */
  httpServer?: iObject
  /**
   * [Optional] When passed as true, Wertik will not start server.
   */
  skip?: boolean
  /**
   * Database connections
   */
  database?: {
    [key: string]: () => Promise<{
      credentials: useDatabaseProps
      instance: Sequelize
    }>
  }
  /**
   * Modules
   */
  modules?: {
    [key: string]: ({
      store: Store,
      configuration: WertikConfiguration,
      app: WertikApp,
    }) => iObject
  }
  /**
   * Storage
   */
  storage?: {
    [key: string]: ({
      configuration: WertikConfiguration,
      wertikApp: WertikApp,
    }) => {
      spacesEndpoint?: iObject
      s3?: iObject
      dropbox?: iObject
    }
  }
  /**
   * Mailer
   */
  mailer?: {
    instances: {
      [key: string]: () => Promise<unknown>
    }
    events?: {
      /**
       * Runs when email sents successfully.
       */
      onEmailSent?: ({
        options: iObject,
        wertikApp: WertikApp,
        configuration: WertikConfiguration,
        emailInstance: any,
        previewURL: string,
        mailer: String,
      }) => void | any | null | undefined
      /**
       * Runs when email fails to send.
       */
      onEmailSentFailed?: ({
        mailer: String,
        wertikApp: WertikApp,
        configuration: WertikConfiguration,
        error: any,
        options: iObject,
      }) => void | any | null | undefined
    }
  }
  /**
   * Sockets
   */
  sockets?: {
    [key: string]: ({
      configuration: WertikConfiguration,
      wertikApp: WertikApp,
    }) => iObject
  }
  /**
   * Graphql
   */
  graphql?: ({
    store: Store,
    configuration: WertikConfiguration,
    wertikApp: WertikApp,
    expressApp: any,
  }) => iObject
  /**
   * Cron Jobs
   */
  cronJobs?: {
    [key: string]: ({
      configuration: WertikConfiguration,
      wertikApp: WertikApp,
    }) => iObject
  }
  queue?: {
    options?: {
      /**
       * When set to true, Wertik JS will use Bull Board UI for Queue Jobs, make sure you have installed this package: @bull-board/express
       */
      useBullBoard?: boolean
      /**
       * Path on which Queue UI will run.
       * @default /admin/queues
       */
      uiPath: string
    }
    jobs: {
      [key: string]: () => iObject
    }
  }
  /**
   * Redis
   */
  redis?: {
    [key: string]: ({
      configuration: WertikConfiguration,
      wertikApp: WertikApp,
    }) => iObject
  }

  /**
   * Winston Logger
   */
  logger?: any
}

export interface WertikApp {
  appEnv: "production" | "development" | "local"
  sendEmail?: ({ mailer: string, options: emailSendProps }) => iObject
  port: number
  modules: iObject
  database: iObject
  models: iObject
  mailer: iObject
  graphql: iObject
  sockets: iObject
  cronJobs: iObject
  storage: iObject
  queue: any
  httpServer?: any
  express?: any
  redis: iObject
  logger: any
}

/**
 * Provide same options that redis createClient method requires.
 */
export interface useRedisProps {
  [key: string]: any
  name: string
}

export interface useMailerProps {
  /**
   * Provide name for your mailer.
   */
  name: string
  /**
   * Provide options that you provide procide to nodemailer.createTransport function.
   */
  options?: {
    [key: string]: any
  }
}
