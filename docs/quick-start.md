# Quick Start

This guide walks you through setting up and starting your first split test. You'll need a user with the `tester` or `admin` role.

## <IconWrapper color="brand" size="28px"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor"><rect fill="none" height="24" width="24"/><path d="M22,7h-9v2h9V7z M22,15h-9v2h9V15z M5.54,11L2,7.46l1.41-1.41l2.12,2.12l4.24-4.24l1.41,1.41L5.54,11z M5.54,19L2,15.46 l1.41-1.41l2.12,2.12l4.24-4.24l1.41,1.41L5.54,19z"/></svg></IconWrapper>Prerequisites

A split test needs a project, an API key and a metric. An audience is optional.

### 1. Create a Project

A project is a website or app you want to test. [Learn more about projects](/projects).

1. Click **Projects** in the main navigation.
2. Click **New Test Project** in the upper-right corner.
3. Fill out the **Details** section.
4. Open **Sections** and click **Add Section**. Give the section a unique ID and a clear description. Whatever you put in its **Data** field becomes the starting template for new variations.

   > A section is the part of your site or app a test changes, anything from a single image to a full page. A visitor joins a test when your code requests that section, so only request it where the change could actually affect behavior.

5. Save the project.

### 2. Create an API Key

Your site or app uses an API key to authenticate with Splitty Test. Each key belongs to one project, so you need at least one per project. [Learn more about API keys](/api-keys).

1. Click **Settings** in the main navigation, then the **API Keys** tab.
2. Click **New API Key** in the upper-right corner.
3. Configure and save the key.

   > The full key is shown **only once**, right after you save. Copy it somewhere safe. If you lose it, you can generate a new key, but the old one stops working.

4. Use the key to [integrate Splitty Test with your site or app](/website-app-integration).

### 3. Create an Audience (Optional)

Without an audience, a test is served to all traffic. Audiences let you narrow it, for example to filter out internal users. [Learn more about audiences](/audiences).

1. Click **Audiences** in the main navigation.
2. Click **New Audience** in the upper-right corner.
3. Configure and save the audience.

> Audiences match against the data your code sends with each session or event, so what you can filter on depends on your integration.

### 4. Create a Metric

Every split test needs a metric to measure. [Learn more about metrics](/metrics).

1. Click **Metrics** in the main navigation.
2. Click **New Metric** in the upper-right corner.
3. Configure and save the metric.

## <IconWrapper color="brand" size="28px"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M4,19h16V5H4V19z M13.41,10.75l1.41,1.42L17.99,9l1.42,1.42L14.82,15L12,12.16L13.41,10.75z M5,7h5v2H5V7z M5,11h5v2H5V11z M5,15h5v2H5V15z" opacity=".3"/><path d="M20,3H4C2.9,3,2,3.9,2,5v14c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V5C22,3.9,21.1,3,20,3z M20,19H4V5h16V19z"/><polygon points="19.41,10.42 17.99,9 14.82,12.17 13.41,10.75 12,12.16 14.82,15"/><rect height="2" width="5" x="5" y="7"/><rect height="2" width="5" x="5" y="11"/><rect height="2" width="5" x="5" y="15"/></g></g></svg></IconWrapper>Set Up the Split Test

1. Click **Split Tests** in the main navigation, then **New Split Test** in the upper-right corner.
2. **Details:** select your project and the section to test.
3. **Audiences:** to target an audience, click **Include an Audience** and select it.

   > With no audiences selected, the test serves all traffic. Included audiences limit it to visitors who match at least one of them. You can also exclude audiences; exclusions override inclusions.

4. **Metrics:** click **Select Decision Metric** and choose your metric.
5. **Variations:** a control variation is already added. You can edit it but not delete it. Usually you leave the control's data empty so your site shows its current default. Click **Add Variation** to add more.

   > Every extra variation makes the test take longer to reach significance.

6. **Strategy:** choose **Standard**, which splits traffic as evenly as possible between variations, and leave **Target Confidence Interval** at 95%.

   > At 95%, a variation is marked as confident once its difference from the control is big enough that it would happen by chance only about 5% of the time. See [What Is Confidence?](/analyzing-data#what-is-confidence)

7. Leave the other settings at their defaults and click **Save Test**.

See [Split Tests](/split-tests) for every setting.

## <IconWrapper color="brand" size="28px"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M12,4c-4.41,0-8,3.59-8,8c0,4.41,3.59,8,8,8s8-3.59,8-8C20,7.59,16.41,4,12,4z M9.5,16.5v-9l7,4.5L9.5,16.5z" enable-background="new" opacity=".3"/><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8c0-4.41,3.59-8,8-8 s8,3.59,8,8C20,16.41,16.41,20,12,20z"/><polygon points="9.5,16.5 16.5,12 9.5,7.5"/></g></g></svg></IconWrapper>Start the Test

Make sure your [integration](/website-app-integration) is in place, then click **Start Test** on your new test.

> Once a test starts, you can only change a few fields, such as its name and description. This protects the integrity of your results.

Now comes the hard part: not checking the results every five minutes. See [Analyzing Data](/analyzing-data) for how to read them.
