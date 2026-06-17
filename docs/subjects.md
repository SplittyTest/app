# Subjects

A subject is the term Splitty Test uses for a website or application that you will be running split tests on. Within a subject there are multiple sections. A section is a specific part of the website or application that you want to test. A section can be any part of a subject as small as something like a button, to as large as an entire page or series of pages. It's really up to you how granular you want your test to be.

Before you run a split test, you must first define a (test) subject and the sections within it. We create this heirarchy in order to control the assignment of tests to users of those subjects.

## Creating a Subject

To create a new test subject in your Splitty Test dashboard, do the following:

1. Click on the "Subjects" link in main navigation.
2. Click the "New Test Subject" button in the upper-right corner.
3. Fill out the form and click "Save Subject" at the bottom.

### Subject Form Fields

**Subject Details**<br>
Basic identifying information about the test subject.

* **Test Subject Name** - A unique and clearly identifiable name for your test subject. Typically the application or website name.
* **Subject ID** - A unique slug to identify the test subject. (e.g. `mywebsite_com` for mywebsite.com)
* **Type** - Select the type of test subject: Website, App, or Other. Helpful for categorization.
* **Description** - A short description of the test subject to help users identify it.

**Sections**<br>
The sections of the website that will have tests run against them. Click "Add Section" to add a new section. You can add as many sections as needed.

* **Section ID** - A unique slug to identify the section. This will be sent with the `participate` request to retrieve an active test for the section.
* **Description** - A short description of the section to help testers more easily identify it.
* **Preview URL** - If applicable, the URL of where a tester might be able to preview the variants for a test. You can include variables in the preview URL that will be dynamically replaced in preview links. See "Previewing Variations" below for more info.
* **Data** - This is the default data template that will be auto-loaded when creating variants for this section in a test. Typically this data is what you are making available on a website and adding it here as a default makes it easier to remember when creating a test.
* **Testing Enabled** - You can toggle testing for this section to enable or disable serving tests at any time.
* **Max Concurrent Tests** - It's typically not recommended that you run too many tests on a specific section at one time. You can set a limit here that will trigger logic to limit the number of tests being run simultaneously.
* **Skip Test Frequency** - How often to skip serving a test to subject users in one rotation. For instance, if set to two, for every three visitors that view the section, 2 of them will not receive a test. Set to 0 to serve tests to all users when there is an active test.

**Settings**<br>
Additional settings for the subject to determine how tests are served and data is logged.

* **Testing Enabled** - You can toggle testing on and off for the subject. If testing is disabled, no active tests will be served to users.
* **Max Concurrent Tests** - Limit the number of active tests that can run on this test subject at the same time.
* **Log Untracked Events** - Enable this to log events that have not been added to metric tracking in an active test.
* **Log unknown events** - Enable this to log events that have not been registered in the Splitty Test dashboard.

## Previewing Variations
Previewing variations requires the developer to setup some custom logic on their website or application, so certain values are called when the `participate` request is made. The `{{test_id}}` and `{{variation_id}}` values are dynamically replaced in preview links from tests. Add some basic logic that pulls the values from the URL into the `participate` request.

**Example**
```js
// preview_url: https://www.mywebsite.com/home?tid={{test_id}}&vid={{variation_id}}

const url_params = new URLSearchParams(window.location.search);
const test_id = url_params.get('tid') || null;
const variation_id = url_params.get('vid') || null;

st.participate('home', {}, {
    test_id,
    variation_id
});
```

**Preview URL Variables**
* **test_id** - Replaced with the test_id of the test the preview link was clicked from.
* **variation_id** - Replaced with the variation_id of the variation the preview link was clicked for.