import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import {RollerCoaster} from "./entity/RollerCoaster";
import {Themepark} from "./entity/Themepark";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5433,
    username: "test",
    password: "test",
    database: "test",
    synchronize: true,
    logging: false,
    entities: [User, RollerCoaster, Themepark],
    migrations: [],
    subscribers: [],
})
