require("dotenv").config();
const { REST, Routes } = require("@discordjs/rest");

const playCmd = require("./commands/play");
const controls = require("./commands/controls");

const commands = [
  playCmd,
  controls.skip,
  controls.pause,
  controls.resume,
  controls.stop,
  controls.queue,
  controls.nowplaying,
  controls.volume,
  controls.loop,
  controls.shuffle,
  controls.remove,
  controls.clear,
].map((c) => c.data.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 Registering slash commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("✅ Slash commands registered successfully!");
  } catch (err) {
    console.error(err);
  }
})();
