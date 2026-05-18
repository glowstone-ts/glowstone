import { Client } from "../packages/dripleaf/src/index.ts"

const host = process.env.REAL_SERVER_HOST
const port = Number(process.env.REAL_SERVER_PORT ?? "25565")

if (!host) {
  console.log("skip: REAL_SERVER_HOST not set")
  process.exit(0)
}

const bot = new Client("DripleafBot")
let spawned = false

bot.on("spawn", () => {
  spawned = true
  console.log("spawned, holding connection for keep-alive test...")
})

bot.on("error", (error) => {
  console.error(error)
  process.exit(1)
})

bot.on("disconnect", (reason) => {
  console.log("disconnect:", reason)
})

bot.on("end", () => {
  if (!spawned) {
    console.error("did not reach play")
    process.exit(1)
  }
  console.log("ok: stayed connected and disconnected cleanly")
  process.exit(0)
})

await bot.connect(host, port)

setTimeout(() => {
  bot.disconnect()
}, 5000)
