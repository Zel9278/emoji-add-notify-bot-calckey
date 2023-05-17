require("dotenv").config() //dotenv file

const Misskey = require("./module/misskey") //export module

const stream = new Misskey(process.env.URI, process.env.TOKEN) //login to bot(url, api key)

let emojis = [] //init emoji array

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
    setInterval(async () => await runner(), 300000) //run emoji checker to 5 Minutes
})

stream.on("note", (msg) => {
    //note event
    const { body: data } = msg //note data

    if (stream.me?.id === data?.user?.id) return //if me
    if (!data?.mentions?.includes(stream.me?.id)) return //if include my id(not)

    const text = data?.text
        .toString()
        .toLowerCase()
        .replace(`@${stream.me?.username}`, "") //get text(no mention)

    if (text.includes("リアクション")) {
        //"リアクション" handler
        const emoji = emojis[Math.floor(Math.random() * emojis.length)]

        stream.api("notes/reactions/create", {
            noteId: data?.id,
            reaction: `:${emoji?.name}:`,
        })
    }

    if (text.includes("フォローして")) {
        //"フォローして" handler
        stream.api("following/create", {
            userId: data?.user?.id,
        })

        stream.api("notes/reactions/create", {
            noteId: data?.id,
            reaction: `:ok_hand:`,
        })
    }
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
        const added_emojis = diff
            .map((emoji) => `$[x2 :${emoji.name}:]\`:${emoji.name}:\``)
            .join("\n") //added emoji list
        stream.api("notes/create", {
            cw: "絵文字が追加されました",
            text: `${added_emojis}`,
            visibility: "public",
            localOnly: true,
        }) //post result
    }
}
