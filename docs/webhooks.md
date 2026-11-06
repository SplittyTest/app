# Webhooks

Webhooks send an HTTP request to a URL you choose when something happens to your tests, such as a test starting or a variation being paused. Use them to post updates to chat, trigger a deploy, or sync results to another system.

Webhooks are managed under **Settings → Webhooks**. You need the `admin` role to create or edit them.

## Creating a Webhook

1. Click **Settings** in the main navigation, then the **Webhooks** tab.
2. Click **New Webhook** in the upper-right corner.
3. Fill out the form, check **Enable Webhook**, and click **Save**.

## Webhook Form Fields

* **Name** – Describes what the webhook does.
* **Project ID** – Only events from this project trigger the webhook.
* **Event Types** – One or more events that trigger it (see below).
* **Method** – `POST` (default) or `GET`. `GET` requests are sent without a body.
* **URL** – Where to send the request.
* **Headers** – Extra headers, such as an auth token for the receiving service. `Content-Type: application/json` is always sent.
* **Extend Payload** – A JSON object merged into every request body. Use it to add fixed values, such as an `event` name or a channel ID.
* **Data Filters** – (Optional) Conditions on the payload that must match for the webhook to fire. They work like [audience filter rules](/audiences#filter-rules).
* **Enable Webhook** – Webhooks are off until enabled.

## Events

| Event | Fires when | Payload |
| --- | --- | --- |
| **Test Creation** (`test_create`) | A test is created | `project_id`, `test` |
| **Test Status Change** (`test_status`) | A test starts, pauses, resumes, stops or is archived | `project_id`, `test_id`, `test`, `old_status`, `new_status` |
| **Test Comment** (`test_comment`) | A comment is added to a test | `project_id`, `test_id`, `comment_id`, `user_id`, `user` (name and email), `content` |
| **Test Calculation** (`test_calculate`) | A running test's results are recalculated | `project_id`, `test_id`, `results` |
| **Variation Status Change** (`variation_status`) | A variation becomes active, paused or archived | `project_id`, `test_id`, `variation_id`, `old_status`, `new_status` |
| **Variation Mode Change** (`variation_mode`) | An auto-optimized test moves a variation between `consideration`, `exploration` and `paused` | `project_id`, `test_id`, `variation_id`, `segment`, `mode`, `conversion_rate`, `timestamp`, `strategy` |

::: tip
The payload doesn't say which event fired. If one webhook listens for several events, add an identifier with **Extend Payload**, or create one webhook per event.
:::

**Test Calculation** can fire as often as every **Minimum Calculation Interval** for each running test, so expect a steady stream of requests.

### Example payload

A **Variation Status Change** webhook with `{"source": "splittytest"}` in Extend Payload sends:

```json
{
    "source": "splittytest",
    "project_id": "mywebsite_com",
    "test_id": "01KT63HN900NKPAN8RJB9NHNF6",
    "variation_id": "01KT63HN900NKPAN8RJB9NHNF6-C",
    "old_status": "active",
    "new_status": "paused"
}
```

## Delivery

* Requests are sent once, with no retries, and time out after 10 seconds.
* Redirects aren't followed.
* For security, URLs that resolve to private or internal network addresses are blocked. To allow them (for example, a service on your own network), set `WEBHOOK_ALLOW_PRIVATE_NETWORKS=true`; see [Environment variables](/getting-set-up#environment-variables).
* Each send is logged in the app's logs with its response status.
