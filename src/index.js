const { Client, GatewayIntentBits, Partials, ActivityType, ApplicationCommandType, ApplicationCommandOptionType, IntentsBitField, REST, Routes } = require('discord.js'); //discord.js から読み込む
const fs = require('fs');
const Keyv = require('keyv')

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});
  

const commands = {};
const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        console.log(`${command.data.name} がロードされました。`);
        try {
            commands[command.data.name] = command;
        } catch (error) {
            console.log(`\u001b[31m${command.data.name} はエラーによりロードされませんでした。\nエラー内容\n ${error}\u001b[0m`);
        }
}

const tokens = fs.readFileSync('database/token.json');
const tokenj = tokens.toString()
const tokena = JSON.parse(tokenj)

const rest = new REST({ version: '10' }).setToken(`${tokena.botoken}`);

client.once('ready', async () => { //ここにボットが起動した際のコードを書く(一度のみ実行)
	console.log('起動完了'); //黒い画面(コンソール)に「起動完了」と表示させる
    const data = []
    for (const commandName in commands) {
        data.push(commands[commandName].data)
    }
    await rest.put(
        Routes.applicationCommands("1259436641848791092"),
        { body: data },
    );
    const bufferData = fs.readFileSync('cmdcount.json');

    // データを文字列に変換
    const dataJSON = bufferData.toString()

    //JSONのデータをJavascriptのオブジェクトに
    const aaa = JSON.parse(dataJSON)

    client.user.setActivity({name:`コマンド実行数:${aaa.name}回 | ${client.guilds.cache.size}鯖`, type:ActivityType.Custom})
});

client.on("interactionCreate", async (interaction) => {
    const bufferData = fs.readFileSync('cmdcount.json');

    // データを文字列に変換
    const dataJSON = bufferData.toString()

    //JSONのデータをJavascriptのオブジェクトに
    const data = JSON.parse(dataJSON)

    var kei = data.name + 1;

    var count = {
        name: kei
    }
    
    const personJSON = JSON.stringify(count)
    
    fs.writeFileSync('cmdcount.json', personJSON)

    client.user.setActivity({name:`コマンド実行数:${kei}回 | ${client.guilds.cache.size}鯖`, type:ActivityType.Custom})

    if (!interaction.isChatInputCommand()) return;
    const command = commands[interaction.commandName];
    if (!command) return;

    if (command.guildOnly && !interaction.inGuild()) {
      await interaction.reply({
          content: 'このコマンドはDMでは使えません。',
          ephemeral: true,
      })
        return;
    }
    try {
        await command.execute(interaction);
    } catch (error) {
        await interaction.reply({
            content: `コマンド実行時にエラーが発生しました。\n${error}`,
        })
    }

});

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(`${tokena.botoken}`); //ログインする
