require("dotenv").config()

const Misskey = require("./module/misskey")

const stream = new Misskey("mi-wo.site", process.env.TOKEN)

let emojis = []

stream.on("connected", async () => {
    stream.postNote("絵文字追加通知Botが起動しました。")
    const api = await stream.api("emojis")
    emojis = api.emojis
    setInterval(async () => await runner(), 25000)
})

const getDifference = (arr1, arr2) =>
    arr2.filter((obj2) => !arr1.some((obj1) => obj2.url === obj1.url))

async function runner() {
    const api = await stream.api("emojis")
    const old = emojis

    emojis = api.emojis

    const diff = getDifference(old, emojis)
    console.log(diff)
    if (diff.length > 0) {
        console.log("絵文字が追加されました。")
        diff.forEach((emoji) => {
            stream.postNote(
                `絵文字が追加されました: :${emoji.name}:\nカテゴリー: ${emoji.category}`
            )
        })
    }
}
