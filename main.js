import Discord, { DiscordAPIError } from 'discord.js'
import * as R from 'ramda'
import Keyv from 'keyv'

import secrets from './secrets'
import config from './r9k'
import messageFilters from './message-filters'


// TODO: Use SQLite: 'sqlite://r9k.db'
const keyv = new Keyv()
keyv.on('error', err => console.log('Connection Error', err));


const client = new Discord.Client()

client.once('ready', () => console.log(`Logged in as ${client.user.tag}.`))
// TODO: Check for when messages are edited too
client.on('message', async message => {
  if (message.channel.type === 'text' && message.channel.name === config.r9kChannelName) {
    // If this message already exists, delete it

    // const enabledMessageFilters = Object.entries(messageFilters).filter(pair => config.filters.includes(pair[0]))
    // console.log('enabledMessageFilters: ' + enabledMessageFilters)

    // const filteredMessage = R.pipe(...enabledMessageFilters)(message.content)
    // console.log('filteredMessage: ' + filteredMessage)

    // TODO: Use the version above instead
    const filteredMessage = messageFilters.noPunctuation(messageFilters.ignoreCase(message.content))
    console.log('filteredMessage: ' + filteredMessage)

    const messageAlreadySeen = !!(await keyv.get(filteredMessage))
    console.log('messageAlreadySeen: ' + messageAlreadySeen)

    if (messageAlreadySeen) {
      try {
        message.delete()
      } catch (DiscordAPIError) {
        // TODO: Better error handling
        message.channel.sendMessage('r9k: error deleting repeated message: missing permissions')
      }

      // TODO: Record this event for the message sender and the message, for cool stats

      // TODO: Do this properly. This is terrible.
      const userString = 'user:' + message.author.id
      const previousUserValue = await keyv.get(userString)
      keyv.set(userString, previousUserValue ? parseInt(previousUserValue) + 1 : 1)

      // TODO: Do this properly. This is terrible.
      const messageString = 'message:' + filteredMessage
      const previousMessageValue = await keyv.get(messageString)
      keyv.set(messageString, previousMessageValue ? parseInt(previousMessageValue) + 1 : 1)
    } else {
      // Otherwise, record this message

      keyv.set(filteredMessage, true)
      console.log('Just seen message: ' + filteredMessage)
    }
  }
})

// You must have added your Discord application client token as an environment
// variable called 'TOKEN'. You should do this by adding this token as a Now secret
// with `$ now secrets add discord-token "mysecretdiscordtoken"` and making sure your now.json
// exposes this secret as an environment variable called `TOKEN`. Example now.json snippet:
// "env": {
//     "TOKEN": "@discord-token"
// }
client.login(secrets.discordToken || process.env.TOKEN)

// This lets Now know that we want this program to continue running and not
// just execute once then terminate.
require('http').createServer().listen(3000)
