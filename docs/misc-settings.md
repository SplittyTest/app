# Miscellaneous Settings

App-wide settings live under **Settings → General**. Anyone can view them; only admins can change them.

## General Settings

* **Locale** – A locale code such as `en-US` or `de-DE`. Controls how numbers and dates are formatted in the dashboard.
* **Currency** – A currency code such as `USD` or `EUR`. Used for metrics displayed as currency.
* **Filtered IP Addresses** – IP addresses or CIDR ranges (e.g. `192.168.0.0/24`) to exclude from test traffic. Requests from these addresses are marked as filtered, and their events aren't logged. Use this to keep your team and office traffic out of your results.

Click **Save Settings** to apply changes, or **Reset** to discard them.

::: warning
Changes to **Filtered IP Addresses** take effect after the app restarts.
:::

## Server Settings

Everything else, such as database connections, email and logging, is configured when you deploy. See [Configuration](/getting-set-up#configuration).
