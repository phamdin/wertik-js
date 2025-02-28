import { get } from "lodash"
import express from "express"
import store from "./store"
import {
  applyRelationshipsFromStoreToDatabase,
  applyRelationshipsFromStoreToGraphql,
} from "./database"
import { emailSender } from "./mailer/index"
import http from "http"
import { WertikConfiguration } from "./types"
import { WertikApp } from "./types"
import { initializeBullBoard } from "./queue/index"

export * from "./database"
export * from "./modules/modules"
export * from "./graphql"
export * from "./mailer"
export * from "./cronJobs"
export * from "./storage"
export * from "./helpers/modules/backup"
export * from "./sockets"
export * from "./queue"
export * from "./redis"
export * from "./logger"

const Wertik: (configuration?: WertikConfiguration) => Promise<WertikApp> = (
  configuration: WertikConfiguration
) => {
  configuration = configuration ? configuration : {}
  return new Promise(async (resolve, reject) => {
    try {
      configuration.appEnv = configuration.appEnv ?? "local"
      const wertikApp: WertikApp = {
        appEnv: configuration.appEnv,
        port: 1200,
        modules: {},
        models: {},
        database: {},
        mailer: {},
        graphql: {},
        sockets: {},
        cronJobs: {},
        storage: {},
        queue: {
          jobs: {},
          bullBoard: {},
        },
        redis: {},
        logger: null,
      }

      const port = get(configuration, "port", 1200)
      const skip = get(configuration, "skip", false)
      const expressApp = get(configuration, "express", express())
      const httpServer = http.createServer(expressApp)

      wertikApp.appEnv = configuration.appEnv
      wertikApp.httpServer = httpServer
      wertikApp.express = expressApp
      wertikApp.port = configuration.port

      if (configuration.mailer && configuration.mailer.instances) {
        for (const mailName of Object.keys(
          configuration.mailer.instances || {}
        )) {
          wertikApp.mailer[mailName] = await configuration.mailer.instances[
            mailName
          ]()
        }
      }

      if (configuration.storage) {
        for (const storageName of Object.keys(configuration.storage || {})) {
          wertikApp.storage[storageName] = await configuration.storage[
            storageName
          ]({
            configuration: configuration,
            wertikApp: wertikApp,
          })
        }
      }

      if (configuration.cronJobs) {
        for (const cronName of Object.keys(configuration.cronJobs || {})) {
          wertikApp.cronJobs[cronName] = await configuration.cronJobs[cronName](
            {
              configuration: configuration,
              wertikApp: wertikApp,
            }
          )
        }
      }

      if (configuration.sockets) {
        for (const socketName of Object.keys(configuration.sockets || {})) {
          wertikApp.sockets[socketName] = await configuration.sockets[
            socketName
          ]({
            configuration: configuration,
            wertikApp: wertikApp,
          })
        }
      }

      if (configuration.database) {
        for (const databaseName of Object.keys(configuration.database || {})) {
          try {
            wertikApp.database[databaseName] = await configuration.database[
              databaseName
            ]()
          } catch (e) {
            throw new Error(e)
          }
        }
      }

      if (configuration.modules) {
        for (const moduleName of Object.keys(configuration.modules || {})) {
          wertikApp.modules[moduleName] = await configuration.modules[
            moduleName
          ]({
            store: store,
            configuration: configuration,
            app: wertikApp,
          })
        }
      }

      if (configuration?.queue?.jobs) {
        for (const queueName of Object.keys(configuration?.queue?.jobs || {})) {
          wertikApp.queue.jobs[queueName] = await configuration.queue.jobs[
            queueName
          ]()
        }
      }

      if (configuration?.queue?.options?.useBullBoard === true) {
        wertikApp.queue.bullBoard = initializeBullBoard({
          wertikApp,
          configuration,
        })
      }

      if (configuration.redis) {
        for (const redisName of Object.keys(configuration.redis || {})) {
          wertikApp.redis[redisName] = await configuration.redis[redisName]({
            wertikApp,
            configuration,
          })
        }
      }

      if (configuration.logger) {
        wertikApp.logger = configuration.logger
      }

      applyRelationshipsFromStoreToDatabase(store, wertikApp)
      applyRelationshipsFromStoreToGraphql(store, wertikApp)

      expressApp.get("/w/info", function (req, res) {
        res.json({
          message: "You are running wertik-js v3",
          version: require("./../../package.json").version,
        })
      })

      wertikApp.sendEmail = emailSender({
        wertikApp,
        configuration,
      })

      if (configuration.graphql) {
        wertikApp.graphql = configuration.graphql({
          wertikApp: wertikApp,
          store: store,
          configuration: configuration,
          expressApp: expressApp,
        })
      }

      expressApp.use(async function (req, _res, next) {
        req.wertik = wertikApp
        next()
      })

      if (!new Object(process.env).hasOwnProperty("TEST_MODE")) {
        setTimeout(async () => {
          if (skip === false) {
            httpServer.listen(port, () => {
              console.log(`Wertik JS app listening at http://localhost:${port}`)
            })
          }
          resolve(wertikApp)
        }, 500)
      } else {
        resolve(wertikApp)
      }
    } catch (e) {
      console.error(e)
      reject(e)
    }
  })
}

export default Wertik
