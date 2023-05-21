require("dotenv").config() //dotenv file

const Misskey = require("./module/misskey") //export module
const MentionHandler = require("./src/mentionHandler")

const stream = new Misskey(process.env.URI, process.env.TOKEN) //login to bot(url, api key)

let emojis = [] //init emoji array

const mentionHandler = new MentionHandler(stream, emojis)

stream.on("connected", async () => {
    //misskey ws connection
    console.log("Bot is ready")
    stream.postNote(
        `絵文字追加通知Botが起動しました。\nuser ${stream.me?.name}(${stream.me?.username})`,
        "public",
        false
    ) //start up notify
    const api = await stream.api("emojis") //get emoji list from api
    emojis = api.emojis //override emoji array
    mentionHandler.emoji(emojis)
    setInterval(async () => await runner(), 300000) //run emoji checker to 5 Minutes
})

stream.on("mention", (msg) => mentionHandler.push(msg.body))
stream.on("api:error", console.error)
stream.on("ws:error", console.error)

const getDifference = (arr1, arr2) =>
    arr2.filter((obj2) => !arr1.some((obj1) => obj2.url === obj1.url)) //diff function

async function runner() {
    //updater
    const api = await stream.api("emojis") //get emoji list from api
    const old = emojis //old emoji array

    emojis = api.emojis //override emoji array
    mentionHandler.emoji(emojis)

    const diff = getDifference(old, emojis) //diff old/new emojis

    if (diff.length > 0) {
        //if diff length
        console.log("絵文字が追加されました。")
        const added_emojis = diff
            .map((emoji) => `$[x2 :${emoji.name}:]\`:${emoji.name}:\``)
            .join("\n") //added emoji list

        stream.postNote(
            `${added_emojis}`,
            "public",
            true,
            "絵文字が追加されました"
        ) //post result
    }
}
