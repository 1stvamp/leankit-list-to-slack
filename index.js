'use strict'

const LeanKitClient = require('leankit-client')
const fetch = require('node-fetch')
const assert = require('assert')
const moment = require('moment')

const SLACK_URL = process.env.SLACK_URL
const LEANKIT_EMAIL = process.env.LEANKIT_EMAIL
const LEANKIT_TOKEN = process.env.LEANKIT_TOKEN
const LEANKIT_PASSWORD = process.env.LEANKIT_PASSWORD
const LEANKIT_ACCOUNT = process.env.LEANKIT_ACCOUNT
const LEANKIT_BOARD_ID = process.env.LEANKIT_BOARD_ID
const LEANKIT_LANE_NAME = process.env.LEANKIT_LANE_NAME

assert(SLACK_URL)
assert([LEANKIT_PASSWORD, LEANKIT_TOKEN].filter(Boolean).length)
assert(LEANKIT_ACCOUNT)
assert(LEANKIT_BOARD_ID)
assert(LEANKIT_LANE_NAME)

const main = async () => {
  try {
    let options
    if (LEANKIT_PASSWORD) {
      assert(LEANKIT_EMAIL)

      options = {
        account: LEANKIT_ACCOUNT,
        email: LEANKIT_EMAIL,
        password: LEANKIT_PASSWORD
      }
    } else {
      options = {
        account: LEANKIT_ACCOUNT,
        token: LEANKIT_TOKEN
      }
    }
    const client = LeanKitClient(options)

    const board = await client.board.get(LEANKIT_BOARD_ID)
    const lane = board.data.lanes.find(x => x.name.toLowerCase() === LEANKIT_LANE_NAME.toLowerCase())
    const cards = await client.card.list({ lanes: lane.id })

    const cardLinks = []
    for (let card of cards.data.cards) {
      cardLinks.push(` • <https://${LEANKIT_ACCOUNT}.leankit.com/card/${card.id}|${card.title}> (${moment(card.movedOn).toNow(true)})`)
    }

    let message
    if (cardLinks.length > 0) {
      message = `LeanKit cards on deck:\n${cardLinks.join('\n')}`
    } else {
      message = 'No LeanKit cards *currently* on deck.'
    }
    console.log(message)
    process.exit(0)
    await fetch(SLACK_URL, {
        method: 'post',
        body:    JSON.stringify({text: message}),
        headers: { 'Content-Type': 'application/json' },
    })
  } catch(err) {
    console.error('error:', err)
    process.exit(1)
  }

}
main().then(() => {
    console.log("done")
})
