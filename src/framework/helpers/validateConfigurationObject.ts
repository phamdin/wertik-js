import checkInstalledPackages from "../initialization/checkInstalledPackages"
import checkModules from "../initialization/checkModules"

export const requiredFields = {
  name: "required",
  dialect: "mysql",
  db_username: "required",
  db_password: "required",
  db_name: "required",
  db_host: "required",
  db_port: "required",
}

export default function (configuration) {
  return new Promise(async (resolve, reject) => {
    try {
      await checkInstalledPackages(configuration)
      await checkModules(configuration)
      resolve(true)
    } catch (errr) {
      reject(errr)
      console.log(errr)
    }
  })
}
