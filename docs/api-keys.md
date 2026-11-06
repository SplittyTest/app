# API Keys

API keys let your website or app talk to Splitty Test. Each key belongs to one project, and every participate and log event request made with it is assigned to that project.

API keys are managed under **Settings → API Keys**. You need the `tester` or `admin` role.

## Creating an API Key

1. Click **Settings** in the main navigation, then the **API Keys** tab.
2. Click **New API Key** in the upper-right corner.
3. Fill out the form and click **Save**.

The full key is shown **only once**, right after you save. Copy it somewhere safe. After that, the dashboard only shows the key's prefix (e.g. `st-35360708`).

To use the key, see [API Authentication](/authentication#use-the-api-key).

## API Key Form Fields

* **Name** – Describes where the key is used, e.g. "Marketing site – production".
* **Project** – The project requests are assigned to.
* **IP Whitelist** – IP addresses or CIDR ranges allowed to use the key. Add `0.0.0.0/0` (and `::/0` for IPv6) to allow any address. **If you leave it empty, every request is rejected.** Browser-based sites usually need to allow all, since requests come from visitors' devices.
* **Domain Whitelist** – Origins allowed to make browser (CORS) requests with the key, e.g. `https://www.example.com`. Add `*` to allow any. Enforced when `NODE_ENV` is `production`; see [NODE_ENV](/getting-set-up#node-env).
* **Status** – **Active** keys work. **Suspended** and **Archived** keys are rejected.

## Rotating a Key

If a key is lost or exposed, click **Generate New Key** next to it in the API keys list. The old key stops working immediately, so update your site with the new one right away.

::: tip
A key used in a browser is visible to anyone who views your page source. That's expected: the key only allows requesting variations and logging events for its project. Use the domain whitelist to limit where it can be used.
:::
