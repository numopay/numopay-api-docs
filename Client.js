const fetch = require('node-fetch')
const crypto = require('crypto')
const queryString = require('query-string')

async function handleErrors(response) {
  if (!response.ok) {
    let json
    try {
      json = await response.json()
    } catch(e) {
      const error = new Error(response.statusText)
      error.response = response
      throw error
    }
    const error = new Error(json.error)
    error.response = response
    error.json = json
    throw error
  }
  return response
}

module.exports = class Client {
  constructor(apiKey, apiSecret, baseUrl = 'https://api.numopay.com') {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.baseUrl = baseUrl
  }

  accessToken(method, path, querySorted, body) {
    //get unix time in seconds
    const timestamp = Math.floor(Date.now() / 1000)

    const version = '2019-12-22'

    const message = timestamp + method.toUpperCase() + path + querySorted + (body || '')

    //create a hexedecimal encoded SHA256 signature of the message
    const signature = crypto.createHmac('sha256', this.apiSecret).update(message).digest('hex')

    return [version, timestamp, this.apiKey, signature].join('.')
  }

  async api(path, {method = 'GET', parameters} = {}) {
    const params = { ...parameters }

    const queryInsteadOfBody = method === 'GET' || method === 'HEAD'
    let query = ''
    let body = undefined
    if (queryInsteadOfBody) {
      // Stringify an object into a query string and sorting the keys.
      const str = queryString.stringify(params)
      if (str) {
        query = `?${str}`
      }
    } else {
      body = JSON.stringify(params)
    }

    const accessToken = this.accessToken(method, path, query, body)

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `NP-ACCESS-TOKEN ${accessToken}`,
    }

    const response = await fetch(this.baseUrl + path + query, {
      method,
      headers,
      body,
    })
    const res = await handleErrors(response)
    return await res.json()
  }
}
