require("dotenv").config() //dotenv file

const Misskey = require("./module/misskey") //export module

const stream = new Misskey("m.c30.life", process.env.TOKEN) //login to bot(url, api key)

let emojis = [] //init emoji array

stream.on("connected", async () => {
    //misskey ws connection
    stream.postNote("絵文字追加通知Botが起動しました。") //start up notify
    const api = await stream.api("emojis") //get emoji list from api
    emojis = api.emojis //override emoji array
    setInterval(async () => await runner(), 25000) //run emoji checker to 25 seconds
})

const getDifference = (arr1, arr2) =>
    arr2.filter((obj2) => !arr1.some((obj1) => obj2.url === obj1.url)) //diff function

async function runner() {
    //updater
    const api = await stream.api("emojis") //get emoji list from api
    const old = emojis //old emoji array

    emojis = api.emojis //override emoji array

    const diff = getDifference(old, emojis) //diff old/new emojis

    if (diff.length > 0) {
        //if diff length
        console.log("絵文字が追加されました。")
        const added_emojis = diff.map((emoji) => `:${emoji.name}:`).join(", ") //added emoji list
        stream.postNote(`絵文字が追加されました: ${added_emojis}`) //post result
    }
}
