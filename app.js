const Discord = require(`discord.js`);
const log = require(`./handlers/logHandler.js`);
const tokens = require(`./tokens.json`);
const fs = require(`fs`);
const client = new Discord.Client();

const SQLite = require("better-sqlite3");
const applydb = new SQLite('assets/apply.sqlite');

const table = applydb.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'Apply';").get();
if (!table['count(*)']) {
  applydb.prepare("CREATE TABLE Apply (userId TEXT PRIMARY KEY, name TEXT, age INTEGER, paypal TEXT, portfolio TEXT, mcm TEXT);").run();
  applydb.prepare("CREATE UNIQUE INDEX idx_scores_id ON Apply (userId);").run();
  applydb.pragma("synchronous = 1");
  applydb.pragma("journal_mode = wal");
}
client.getApply = applydb.prepare("SELECT * FROM Apply WHERE userId = ?");
client.setApply = applydb.prepare("INSERT OR REPLACE INTO Apply (userId, name, age, paypal, portfolio, mcm) VALUES (@userId, @name, @age, @paypal, @portfolio, @mcm);");

client.tokens = tokens;
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./commands', (err, files) => {
  if (err) console.error(err);
  files.forEach(f => {
    let props = require(`./commands/${f}`);
    log.info(`Loading Command: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
  log.info(`Loading a total of ${files.length} commands.`);
});

fs.readdir('./events/', (err, files) => {
  if (err) console.error(err);
  log.info(`Loading a total of ${files.length} events.`);
  files.forEach(file => {
    const eventName = file.split(".")[0];
    const event = require(`./events/${file}`);
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
  });
});

client.on('error', console.error);

process.on("unhandledRejection", err => {
  log.error("Unhandled Promise Rejection: " + err.stack);
});

client.login(`${tokens.token}`);