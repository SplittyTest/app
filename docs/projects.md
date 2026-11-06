# Projects

A **project** is a website or app you run split tests on. Each project contains **sections**: the specific parts you test. A section can be as small as a button or as large as a page or a series of pages.

You need a project with at least one section before you can create a test. Splitty Test uses this structure to decide which tests a visitor can be placed in.

## Creating a Project

1. Click **Projects** in the main navigation.
2. Click **New Test Project** in the upper-right corner.
3. Fill out the form and click **Save Project**.

## Project Form Fields

### Project Details

* **Test Project Name** – A unique, recognizable name, usually the site or app name.
* **Project ID** – A unique slug, e.g. `mywebsite_com`.
* **Type** – Website, App or Other. Used for organization only.
* **Description** – A short description to help your team identify the project.

### Sections

Click **Add Section** to add as many as you need.

* **Section ID** – A unique slug that your code sends as `section_id` in participate requests. Use lowercase letters, numbers and underscores.
* **Description** – Helps testers identify the section.
* **Preview URL** – (Optional) Where testers can preview variations. It can include variables; see [Previewing Variations](#previewing-variations).
* **Data** – The default data template for new variations in this section. It usually mirrors the values your site lets you change.
* **Testing Enabled** – Turns test serving on or off for this section.
* **Max Concurrent Tests** – The most tests that can run on this section at once. Running many at once isn't recommended.
* **Skip Test Frequency** – Holds some visitors out of testing. Each active test takes one slot in a rotation, and this value adds that many "skip" slots. With one active test and a value of `2`, two of every three visitors get no test. Set to `0` to include everyone.

### Settings

* **Testing Enabled** – Turns test serving on or off for the whole project.
* **Max Concurrent Tests** – The most tests that can run across the project at once.
* **Log Untracked Events** – Stores events for metrics that no active test is tracking.
* **Log Unknown Events** – Stores events whose type doesn't match any metric in the dashboard. Requires **Log Untracked Events** too.

## Previewing Variations

Preview links let testers see a specific variation. To support them, read the IDs from the preview URL and pass them to your participate call.

When Splitty Test builds a preview link, it replaces these variables in the section's Preview URL:

* `{{test_id}}` – the test the link was opened from
* `{{variation_id}}` – the variation being previewed

```js
// Preview URL: https://www.mywebsite.com/home?tid={{test_id}}&vid={{variation_id}}

const params = new URLSearchParams(window.location.search);

st.participate('home', {}, {
    test_id: params.get('tid'),
    variation_id: params.get('vid'),
});
```

Previewed variations aren't recorded in your results.
