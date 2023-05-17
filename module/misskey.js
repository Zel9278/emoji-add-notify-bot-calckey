const ws = require("ws")
const axios = require("axios")
const EventEmitter = require("events")

class Misskey extends EventEmitter {
    constructor(host, token) {
        super(host, token)

        this.host = host
        this.token = token
        this.uri = `wss://${host}/streaming?i=${token}`
        this.ws = new ws(this.uri)
        this.connected = false

        this.ws.on("error", console.error)
        this.ws.on("open", async (e) => {
            this.ws.send(
                JSON.stringify({
                    type: "connect",
                    body: {
                        channel: "main",
                        id: "main",
                    },
                })
            )
            this.ws.send(
                JSON.stringify({
                    type: "connect",
                    body: {
                        channel: "hybridTimeline",
                        id: "social",
                    },
                })
            )
            this.me = await this.api("i")
            this.connected = true

            this.emit("connected", this.me)
        })

        this.ws.on("message", (msg) => {
            const { body } = JSON.parse(msg)
            this.emit(body.type, body)
        })
    }

    async api(endPoint, data) {
        const postUrl = `https://${this.host}/api/${endPoint}`
        const postData = Object.assign({ i: this.token }, data)

        try {
            const { data } = await axios.post(postUrl, postData, {
                headers: {
                    "Content-Type": "application/json",
                },
            })

            return data
        } catch (error) {
            this.emit("api:error", error)
        }
    }

    postNote(text, visibility, localOnly) {
        this.api("notes/create", {
            text,
            visibility,
            localOnly,
        })
    }
}

module.exports = Misskey
