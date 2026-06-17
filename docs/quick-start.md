# Quick Start

This is a quick guide to help you get your first split test going.

## <IconWrapper color="brand" size="28px"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor"><rect fill="none" height="24" width="24"/><path d="M22,7h-9v2h9V7z M22,15h-9v2h9V15z M5.54,11L2,7.46l1.41-1.41l2.12,2.12l4.24-4.24l1.41,1.41L5.54,11z M5.54,19L2,15.46 l1.41-1.41l2.12,2.12l4.24-4.24l1.41,1.41L5.54,19z"/></svg></IconWrapper>Prerequisites

Before creating your first split test, you will need to create the supporting data for that split test. You will need a user with the `tester` or `admin` role to complete the steps needed to start a test.

### Create a Subject to Run the Test On

A subject is a website or app that you want to run a split test on. You can learn more about test subjects [here](/subjects).

1. Click on the "Subjects" link in the main navigation.
2. Click the "New Test Subject" button in the upper right corner.
3. Complete the data in the "Details" section of the new subject form.
4. Open the "Sections" section of the form.
5. Click the "Add Section" button to add a new section to the subject. Give your section a unique ID and a good description. The data you put in the `data` field will be used as a template when you add a new variation to your tests.

> A section is a portion of your wesbite or app that you want to run a test on. A section can be something as large as a full page or as small as a single image. Test participations are triggered when that section requested by a user, so keep that in mind when deciding how to create sections. You don't want to trigger a test unless you're sure the thing you are testing might actually affect user behavior.

6. Save your subject.

### Create an API Key to Integrate with Your Site or App

You'll need at least one API key for each subject your create in order to make requests to your Splitty Test instance from your website or app. The API key will authenticate requests from your website or app and also set the subject for the session. You can learn more about API keys [here](/api-keys).

1. Click on the "Settings" link in the main navigation.
2. Click the "API Keys" tab.
3. Click the "New API Key" button in the upper right corner.
4. Configure and save the new API key.

> When you save the API key, a window will pop up that will show you the API key *once and only once*. It is important that you copy and save the API key somewhere so when you complete the integration you have it on hand. If you lose the API key, you can generate a new one, but doing so will invalidate any requests using the old API key.

5. Using this API key, [complete the integration with your website or app](/website-app-integration).

### Create an Audience for the Test

Without an audience, your test will be served to everyone that sees it. Audiences are useful for filtering out things like internal users. If you don't want to filter the traffic going to your test, you can skip this step. You can learn more about audiences [here](/audiences).

> Audiences are determined by matching against the data that is sent with a session or event. That data is decided by how you implement the code on your site or app.

1. Click on the "Audiences" link in the main navigation.
2. Click the "New Audience" button in the upper right corner.
3. Configure and save the new audience.

You will use this audience when creating your split test.

### Create a Metric to Track for the Test

Registering a metric in Splitty Test allows you to view important insights about that metric. You cannot create a split test without a metric.
You can learn more about metrics [here](/metrics).

1. Click on the "Metrics" link in the main navigation.
2. Click the "New Metric" button in the upper right corner.
3. Configure and save the new metric.

## <IconWrapper color="brand" size="28px"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M4,19h16V5H4V19z M13.41,10.75l1.41,1.42L17.99,9l1.42,1.42L14.82,15L12,12.16L13.41,10.75z M5,7h5v2H5V7z M5,11h5v2H5V11z M5,15h5v2H5V15z" opacity=".3"/><path d="M20,3H4C2.9,3,2,3.9,2,5v14c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V5C22,3.9,21.1,3,20,3z M20,19H4V5h16V19z"/><polygon points="19.41,10.42 17.99,9 14.82,12.17 13.41,10.75 12,12.16 14.82,15"/><rect height="2" width="5" x="5" y="7"/><rect height="2" width="5" x="5" y="11"/><rect height="2" width="5" x="5" y="15"/></g></g></svg></IconWrapper>Set Up the Split Test

If you've completed the steps above, you have everything necessary to set up your first split test. Don't forget to complete the integration with your website or app.

1. Click on the "Split Tests" link in the main navigation.
2. Click the "New Split Test" button in the upper right corner.
3. Fill out the "Details" section of the form. Select the subject we previously created, then select the section you want to test.
4. Continue to the "Audiences" section of the form. If you created an audience earlier that you want to target, click the "Include an Audience" button and select the audience.

> If no audiences are selected, the test will serve to all traffic. Including an audience will limit the traffic to only the users that match any of the inlcuded audiences. Also, you can explicitly exclude certain audiences. Ecluding an audience overrides any included audiences.

1. Continue to the "Metrics" section of the form and click the "Select Decision Metric" button.
2. Select the metric you created earlier.
3. Continue to the "Variations" section of the form.

> All tests will have a control variation already populated. While you cannot delete the control variation, you can make edits to it. Typically, you do not want the control variation to send back variation data so it uses the default data from your website or app.

8. Add any number of additional variations to the test by clicking the "Add Variation" button.

> Too many variations can increase the time it takes your test to reach siginificance, so keep that in mind.

9. Continue to the "Strategy" section of the form. We'll start simple and choose the **Standard** strategy for our test. This allocates traffic as evenly as it can between variations. We'll also set the **Target Confidence Interval** to the default 95%.

> The Target Confidence Interval on standard tests will help us determine if the data we're seeing in the test results is significant or not. When a variation is marked with 95% confidence in the test results, that means there is only a 5% chance that the result we are seeing for the variation might not be accurate compared to the control variation.

10.  We'll use the default settings for the rest of the values. Click the "Save Test" button at the bottom of the form.

Click [here](/split-tests) for a more detailed look at all the features and settings for a split test.

## <IconWrapper color="brand" size="28px"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M12,4c-4.41,0-8,3.59-8,8c0,4.41,3.59,8,8,8s8-3.59,8-8C20,7.59,16.41,4,12,4z M9.5,16.5v-9l7,4.5L9.5,16.5z" enable-background="new" opacity=".3"/><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8c0-4.41,3.59-8,8-8 s8,3.59,8,8C20,16.41,16.41,20,12,20z"/><polygon points="9.5,16.5 16.5,12 9.5,7.5"/></g></g></svg></IconWrapper>Start the Test

Okay, so maybe this wasn't such a quick start. But once you get the hang of running tests, you'll be able to breeze through these steps every time. Our test is set up and ready to go, we we now just have to click the "Start Test" button on the test we just created.

> You can't make changes to your test once it's been started (aside from a limited number of fields like the name and description). Makeing changes might affect the integrity of your data, so we limit what can be done. But now that your test is running, you anxiously click on the results every 5 minutes to see how it's doing.

