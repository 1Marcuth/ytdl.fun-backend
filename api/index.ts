import express from "express"
import http from "http"
import cors from "cors"

import router from "./routers/video"

class App {
    private app: express.Application
    private server?: http.Server
    private port = Number(process.env.PORT || 3001)

    constructor() {
        this.app = express()
    }

    private useRoutes() {
        this.app.use("/video", router)
    }

    private useMidleware() {
        this.app.use(cors({ origin: "*" }))
        this.app.use(express.urlencoded({ extended: false }))
        this.app.use(express.json())
    }

    private startServer() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`> [app] Server listening on http://localhost:${this.port}/`)
                return resolve(null)
            })
        })
    }

    public async start() {
        this.useMidleware()
        this.useRoutes()
        await this.startServer()
    }

    public async stop() {
        return new Promise((resolve, reject) => {
            this.server?.close((error) => {
                console.log(`> [app] Server stopped as successful!`)
                return resolve(null)
            })
        })
    }
}

export default App