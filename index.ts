import App from "./api"

(async () => {
    const app = new App()

    await app.start()
})()