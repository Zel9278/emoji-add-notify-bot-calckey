require("dotenv").config() //dotenv file

const moment = require("moment-timezone")

const Misskey = require("./module/misskey") //export module
const MentionHandler = require("./src/mentionHandler")

const stream = new Misskey(process.env.URI, process.env.TOKEN) //login to bot(url, api key)

let emojis = [] //init emoji array
let isReconnect = false //init reconnect flag
let timer = null

const mentionHandler = new MentionHandler(stream, emojis)

console.log(`[LOG - ${moment().format("yyyy-MM-DD hh:mm:ss")}] Bot Started`)

stream.on("ws:connected", async () => {
    //misskey ws connection
    if (!isReconnect) {
        stream.send(
            `絵文字追加通知Botが起動しました。\nuser ${stream.me?.name}(${stream.me?.username})`,
            "public",
            false
        ) //start up notify
    }

    console.log(
        `[LOG - ${moment().format("yyyy-MM-DD hh:mm:ss")}] Bot Connected`
    )

    isReconnect = false
    const api = await stream.getEmojis() //get emoji list from api
    emojis = api //override emoji array
    mentionHandler.emoji(emojis)
    console.log(
        `[LOG - ${moment().format("yyyy-MM-DD hh:mm:ss")}] Emojis Count: ${
            emojis.length
        }`
    )

    timer = setInterval(async () => await runner(), 150000) //run emoji checker to 2.5min
})

stream.on("ws:disconnected", () => {
    console.log(
        `[LOG - ${moment().format("yyyy-MM-DD hh:mm:ss")}] Bot Disconnected`
    )
    isReconnect = true
    clearInterval(timer)
    reconnectHandler() //reconnect handler
})

stream.on("mention", (msg) => {
    console.log(
        `[LOG - ${moment().format("yyyy-MM-DD hh:mm:ss")}] Mention Handled by ${
            msg.user?.name
        }`
    )
    mentionHandler.push(msg.body)
}) //mention handler

const getDifference = (arr1, arr2) =>
    arr2.filter((obj2) => !arr1.some((obj1) => obj2.url === obj1.url)) //diff function

async function runner() {
    console.log(
        `[LOG - ${moment().format("yyyy-MM-DD hh:mm:ss")}] Runnner Started`
    )
    //updater
    const api = await stream.getEmojis() //get emoji list from api
    const old = emojis //old emoji array

    emojis = api //override emoji array
    mentionHandler.emoji(emojis)

    const diff = getDifference(old, emojis) //diff old/new emojis

    if (diff.length > 0) {
        //if diff length
        console.log(
            `[LOG - ${moment().format("yyyy-MM-DD hh:mm:ss")}] Emoji Added: ${
                diff.length
            }`
        )

        const added_emojis = diff
            .map((emoji) => `$[x2 :${emoji.name}:]\`:${emoji.name}:\``)
            .join("\n") //added emoji list

        stream.send(
            `${added_emojis}`,
            "public",
            false,
            "絵文字が追加されました"
        ) //post result
    }
}

function reconnectHandler() {
    //reconnect handler
    console.log("[Bot] Reconnecting in 15sec...")
    setTimeout(async () => await stream.connect(), 15000) //reconnect to 15sec
}

process.on("unhandledRejection", console.error) //error handler
process.on("uncaughtException", console.error) //error handler
