import {IConfiguration} from "./../types/configuration";
export default function (configuration: IConfiguration) {
    return new Promise((resolve, reject) => {
        try {
            let keys = Object.keys(configuration);
            keys.forEach((key,index) => {
                let value = configuration[key];
                process.env[key] = value;
                if (index + 1 == keys.length) {
                    resolve("Added to env.");
                }
            });
        } catch (e) {
            reject(e.message);
        }
    })
	
}