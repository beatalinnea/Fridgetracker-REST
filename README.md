# Fridgetracker API v1.0.0
Your personal fridge assistant

- Save some steps! Ask your fridge what's inside, without having to go and check.
- Prevent mold! Fridgetracker can send you a POST request containing your expired products when they expire.
- Stop having to communicate! Is your partner wondering if you've run out of milk? No need to ask you!

## What is Fridgetracker?
Fridgetracker is a RESTful API where you can register an account and keep track of your fridge (or fridges) and their contents.

### Having an account
As a user, you can only view your own fridge/fridges and their containing products. You are fully authorized to view, create, update, and delete your fridges and products.

## How do I use Fridgetracker?
Fridgetracker API provides HTTP methods for you to call. All endpoints are available [here](https://cscloud7-189.lnu.se/fridgetracker/api-docs/)

### JWT
Authentication is made possible using JWT (Json Web Token). Here's an explanation of the flow:
- Register an account if you don't already have one.
- Log in with username and password in the request body.
- You will get an access token back in the response if the credentials are correct.
- Use this access token in your header as "Authorization": "Bearer `${token}`" for further requests using the API.

### POSTMAN
Postman collection for testing and demonstrating endpoints is available [here](https://www.postman.com/beatalinnea/workspace/fridge-tracker/documentation/29038444-d44c441d-5b1a-41cf-9d86-2d486fb1cbad).

## Webhook
The API has an implemented webhook. You can register a webhook URL and a chosen webhook secret on any of your fridges. Do this with a POST request to `https://cscloud7-189.lnu.se/fridgetracker/api/v1/fridge/:id/webhook` and specify your URL to be called and secret to be sent with future webhook requests from us within the JSON request body (see example [here](https://cscloud7-189.lnu.se/fridgetracker/api-docs/))
- When anyone calls `https://cscloud7-189.lnu.se/fridgetracker/api/v1/fridge/cleanout`, all fridges with a set webhook URL will get a POST request to that url containing that specific fridge's expired products.
