# Users

Users are the people who sign in to the Splitty Test dashboard. Each user has a role that controls what they can do.

Users are managed under **Settings → Users**. Only admins can add, edit or remove other users.

## Roles

| Role | Can |
| --- | --- |
| **Viewer** | View projects, tests, results, metrics and audiences |
| **Commenter** | Everything a viewer can, plus comment on tests |
| **Tester** | Everything a commenter can, plus create and edit projects, metrics, audiences, split tests and API keys, and start or stop tests |
| **Admin** | Everything, plus manage users, webhooks and general settings |

New users default to **Tester**.

## Adding a User

1. Click **Settings** in the main navigation, then the **Users** tab.
2. Click **New User** in the upper-right corner.
3. Enter their details, set a password, choose a role, and click **Save**.

Share the password with them securely and ask them to change it after signing in.

## User Form Fields

* **First Name**, **Last Name** and **Email** – Email is used to sign in and must be unique.
* **Phone** – (Optional) Used for multi-factor authentication.
* **Password** and **Confirm Password** – When editing, leave blank to keep the current password.
* **Role** – See [Roles](#roles).
* **Status**:
  * **Active** – Can sign in.
  * **Suspended** – Can't sign in or reset their password. Use this to temporarily block access.
  * **Archived** – Can't sign in. Use this for people who have left, to keep their name on past tests and comments.

## Editing Your Own Account

Any user can edit their own name, email, phone and password. Changing your password requires your current password and signs you out on other devices. You can't change your own role or status, so an admin can't accidentally lock themselves out.

If an admin changes someone's password, that user is signed out everywhere.

## Forgotten Passwords

Users can reset their own password from **I forgot my password** on the login page, if [email is set up](/getting-set-up#using-mailgun). Without email, an admin can set a new password for them here.
