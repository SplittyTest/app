# Audiences

An **audience** is a reusable set of rules that decides which visitors a test is served to. Use audiences to target a group (mobile visitors, a region) or to exclude one (your own team, a QA tool).

Audiences match against the visitor data your code sends in `data` with participate and log event requests. If you don't send a property, you can't filter on it.

## How Audiences Apply to a Test

* **No audiences:** the test is served to all traffic.
* **Included audiences:** only visitors who match at least one of them can be placed in the test.
* **Excluded audiences:** visitors who match any of them are never placed in the test. Exclusions win over inclusions.

Visitors who don't qualify get `variation: null` and should see your default content. You choose audiences in the **Audiences** step of the [split test form](/split-tests#audiences).

## Creating an Audience

1. Click **Audiences** in the main navigation.
2. Click **New Audience** in the upper-right corner.
3. Choose a **Project**, give the audience a **Name** and optional **Description**, and add **Filter Rules**.
4. Click **Save Audience**.

::: warning
Editing an audience that active tests use changes who those tests reach mid-run, which can skew their results. The form warns you when this applies.
:::

## Filter Rules

Rules are made of **conditions** grouped into **condition groups**:

* All conditions in a group must match (AND).
* A visitor matches the audience if **any** group matches (OR).

Each condition has a **property**, a **comparison** and a **value**. The value is parsed as JSON, so write strings in quotes (`"mobile"`), numbers without (`3`), and lists in brackets (`["us", "ca"]`). Use dot notation for nested properties (`device.type`). Splitty Test also adds the visitor's IP address as `$ip`, which you can use with **in any IP range**. Click the invert button on a condition to negate it.

| Comparison | Matches when the property… | Example value |
| --- | --- | --- |
| equals | is exactly the value | `"mobile"` |
| includes | is one of the values in the list | `["us", "ca"]` |
| intersects | is a list that shares at least one item with the value | `["beta", "vip"]` |
| greater than / greater than or equals | is larger than (or equal to) the value | `3` |
| less than / less than or equals | is smaller than (or equal to) the value | `100` |
| between | is strictly between two values | `[18, 65]` |
| within | is between two values, inclusive | `[18, 65]` |
| matches | matches a regular expression | `"^/blog/"` |
| matches some | matches at least one regular expression | `["^/blog/", "^/news/"]` |
| matches all | matches every regular expression | `["^/shop/", "sale"]` |
| in any IP range | is an IP address in one of the ranges | `["10.0.0.0/8"]` |
| is nil | is missing or `null` | – |
| is null | is `null` | – |
| is undefined | is missing | – |

### Example

To target mobile visitors in the US or Canada, excluding anyone flagged as internal, create one group with three conditions:

| Property | Comparison | Value | Inverted |
| --- | --- | --- | --- |
| `device` | equals | `"mobile"` | |
| `country` | includes | `["us", "ca"]` | |
| `internal` | equals | `true` | ✓ |

To filter internal traffic everywhere, not just per test, add your office IPs to **Filtered IP Addresses** in [Misc Settings](/misc-settings).
