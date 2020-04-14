# Numopay API Documentation

This repo contains the official Numopay API documentation

## Contents

- [Authentication](#authentication)
- [Accounts](#accounts)
- [List accounts](#list-accounts)
- [Show an account](#show-an-account)
- [Show account balance](#show-account-balance)
- [Create charge token](#create-charge-token)
- [Charge money](#charge-money)
- [Show payment status](#show-payment-status)
    + [State code errors](#state-code-errors)
- [Create refill token](#create-refill-token)
- [Refill](#refill)
- [Create webhook-endpoint](#create-webhook-endpoint)
- [Update webhook-endpoint](#update-webhook-endpoint)
- [List webhook-endpoints](#list-webhook-endpoints)
- [Delete webhook-endpoint](#delete-webhook-endpoint)
- [Webhook Event](#webhook-event)
- [Get current time](#get-current-time)

## Authentication

All API key requests must be signed and contain the authorization header:
* `Authorization: NP-ACCESS-TOKEN <token>` (see below)

All request bodies should have content type application/json and be valid JSON.

`const token = version + '.' + timestamp + '.' + apiKey + '.' + signature`

The `signature` is generated by creating a sha256 HMAC using the secret key on the prehash string `timestamp + method + requestPath + query + body` (where + represents string concatenation).

The `body` is the request body string or omitted if there is no request body (typically for GET requests).

The `method` should be UPPER CASE.

The `timestamp` MUST be number of seconds since [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time).

The `query` must be sorted by query parameter names and started with '?' or omitted if there is no query params in request

The `version` is string `2019-12-22`

Your timestamp must be within 30 seconds of the api service time or your request will be considered expired and rejected. We recommend using the [time](#get-current-time) endpoint to query for the API server time if you believe there many be time skew between your server and the API servers.

Client implementation example:
* [Client.js](./Client.js)

```js
const Client = require('./Client')
// Set these in your ENVironment, or enter them here with the actual string
const apiKey = ''
const apiSecret = ''
const client = new Client(apiKey, apiSecret)
```

## Accounts

Account resource represents all of a user’s accounts

## List accounts

Lists current user’s accounts to which the authentication method has access to.

`GET https://api.numopay.com/v2/accounts`

```js
await client.api('/v2/accounts')

{
  "data": [
    {
      "id": "423e5010-24d7-11ea-a0af-ad4afa2c683c",
      "currency": "RUB"
    }
  ]
}
```

## Show an account

Show current user’s account.

`GET https://api.numopay.com/v2/accounts/:account_id`

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c')

{
  "data": {
    "id": "423e5010-24d7-11ea-a0af-ad4afa2c683c",
    "currency": "RUB"
  }
}
```

## Show account balance

Show current balance on the user’s account at the current moment.

`GET https://api.numopay.com/v2/accounts/:account_id/balance`

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/balance')

{
  "data": {
    "amount": "44444",
    "currency": "RUB"
  }
}
```

## Create charge token

`POST https://api.numopay.com/v2/accounts/:account_id/charge/token`

| POST params | description | type |
|--:|--:|--:|
| redirect_url | Link to the page to which the user will get after entering 3dsec | string |
| amount | Amount (in kopecks) | string |

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/charge/token', {method: 'POST', parameters: {amount: '100', redirect_url: 'https://example.com'}})

{
  "data": {
    "token": "1f5146dd-9149-42f1-83d8-9470adb04529",
    "order_slug": "client_wof_34101_8e4001br"
  }
}
```

## Charge money

`POST https://api.numopay.com/v2/accounts/:account_id/charge`

Charge money from card

| POST params | description | type |
|--:|--:|--:|
| token | The token required to request this method. Life time is 15 minutes. Number of attempts - 1 | string |
| card_info | Card information | object |

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/charge', {method: 'POST', parameters: {token: '1f5146dd-9149-42f1-83d8-9470adb04529', card_info: {number: '4444555566667777', month: '12', year: '2021', cvv: '123', holder: 'NUMO PAY'}}})

{
  "data": {
    "charge_link": "https://api.numopay.com/v2/charge/txIZaVS48URiXykjHR6cItDrWtero3rt"
  }
}
```

## Show payment status

The method can be used to request the payment status.

`GET https://api.numopay.com/v2/accounts/:account_id/payment/:order_slug`

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/payment/client_wof_34101_8e4001br')

{
  "data": {
    "order_slug": "client_wof_34101_8e4001br",
    "is_completed": true,
    "status": "success",
    "type": "charge_unregistered",
    "amount": "100",
    "currency": "RUB",
    "card_number": "4444********7777",
    "state_code": 0,
    "state_description": "Нет ошибки"
  }
}
```

| Response field | Description |
|--:|--:|
| order_slug |	Unique identifier for the operation |
| is_completed |	Operation completion status |
| status | Transaction status |
| type |	Type of transaction (refill_unregistered \| charge_unregistered) |
| amount |	Charge amount (in kopecks) |
| currency |	Transaction currency (now only RUB) |
| card_number |	Masked card number |
| state_code |	Error code |
| state_description |	Error description |

#### State code errors

| state_code | state_description |
|--:|--:|
| 0 |	Ошибок нет |
| 10 |	Недостаточно средств |
| 11 |	Карта не найдена |
| 12 |	Недействительная карта |
| 13 |	Транзакция недоступна для держателя карты |
| 14 |	Срок действия карты истек |
| 15 |	Карта утеряна |
| 16 |	Превышены лимиты карты |
| 17 |	Отказ эмитента или платежной системы |
| 18 |	Операции по карте ограничены |
| 19 |	Карта изъята |
| 20 |	Недействительный номер карты |
| 21 |	Не найден бин |
| 22 |	Операции пополнения недоступны по карте |
| 23 |	Неверный ввод CVV2 |
| 24 |	Карта украдена |
| 25 |	Карта изъята |
| 26 |	Карта не найдена |

## Create refill token

`POST https://api.numopay.com/v2/accounts/:account_id/refill/token`

| POST params | description | type |
|--:|--:|--:|
| amount | Amount (in kopecks) | string |

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/refill/token', {method: 'POST', parameters: {amount: '100'}})

{
  "data": {
    "token": "343444b5-1b19-4d4f-b1d5-30e435482da5",
    "order_slug": "client_frg_345678_888e8e8e8e"
  }
}
```

## Refill

Refill card

`POST https://api.numopay.com/v2/accounts/:account_id/refill`

| POST params | description | type |
|--:|--:|--:|
| token | The token required to request this method. Life time is 15 minutes. Number of attempts - 1 | string |
| card_number | Card number | string |

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/refill', {method: 'POST', parameters: {token: '343444b5-1b19-4d4f-b1d5-30e435482da5', card_number: "4444555566667777"}})

{
  "data": {
    "token": "343444b5-1b19-4d4f-b1d5-30e435482da5"
  }
}
```

## Create webhook-endpoint

`POST https://api.numopay.com/v2/accounts/:account_id/webhook-endpoints`

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/webhook-endpoints', {method: 'POST', parameters: {url: 'https://example.com/webhook/secret', event: 'order'}})

{
  "data": {
    "id": "4db138f8-ea4f-4093-ba61-b948c7e75b8d",
    "url": "https://example.com/webhook/secret",
    "event": "order",
    "created_at": "2020-04-08T14:12:03.084Z",
    "updated_at": "2020-04-08T14:12:03.084Z"
  }
}
```

## Update webhook-endpoint

`PUT https://api.numopay.com/v2/accounts/:account_id/webhook-endpoints/:id`

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/webhook-endpoints/4db138f8-ea4f-4093-ba61-b948c7e75b8d', {method: 'PUT', parameters: {url: 'https://example.com/webhook2/secret2', event: 'order'}})

{
  "data": {
    "id": "4db138f8-ea4f-4093-ba61-b948c7e75b8d",
    "url": "https://example.com/webhook2/secret2",
    "event": "order",
    "created_at": "2020-04-08T14:12:03.084Z",
    "updated_at": "2020-04-08T14:18:32.440Z"
  }
}
```

## List webhook-endpoints

`GET https://api.numopay.com/v2/accounts/:account_id/webhook-endpoints`

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/webhook-endpoints')

{
  "data": [
    {
      "id": "4db138f8-ea4f-4093-ba61-b948c7e75b8d",
      "url": "https://example.com/webhook2/secret2",
      "event": "order",
      "created_at": "2020-04-08T14:12:03.084Z",
      "updated_at": "2020-04-08T14:18:32.440Z"
    }
  ]
}
```

## Delete webhook-endpoint

`DELETE https://api.numopay.com/v2/accounts/:account_id/webhook-endpoints/:id`

```js
await client.api('/v2/accounts/423e5010-24d7-11ea-a0af-ad4afa2c683c/webhook-endpoints/4db138f8-ea4f-4093-ba61-b948c7e75b8d', {method: 'DELETE'})

{
  "data": {
    "id": "4db138f8-ea4f-4093-ba61-b948c7e75b8d"
  }
}
```

## Webhook Event

```js
{
  "type": "order",
  "data": {
    // ... 'Show payment status' data
  },
  "event_at": "2020-04-08T14:12:03.084Z"
}
```

## Get current time

Get the API server time.

This endpoint doesn’t require authentication.

`GET https://api.numopay.com/v2/time`

```js
await client.api('/v2/time')

{
  "data": {
    "iso": "2019-12-22T13:33:21.647Z",
    "epoch": 1577021601
  }
}
```
