# Getting Set Up

This is a guide for getting your own instance of Splitty Test up and running so you can begin testing. Remember to review the [license](license.html) information before spinning it up.

Splitty Test is distributed as a source-available project. We want everyone to be able to use Splitty Test free-of-charge for personal or commercial use, but we want to protect our exclusive right to offer support and hosting as a service in the future. If you're interested in offering Splitty Test as a hosted service, you can [reach out to us](mailto:partners@splittytest.com).

## Prerequisites
* Clickhouse
* Postgres
* Redis

## Database Migrations

You can run the database migrations using **NPM**.

1. Change the working directory to the `api` folder.
```bash
$ cd path/to/splitty-test/api
```

2. Run the migrate script for the database you are using.
```bash
$ npm run migrate:postgres
$ npm run migrate:clickhouse
```

## Docker

Coming soon...

## Helm

Coming soon...

## Configuration

Coming soon...

## Using MailGun

Coming soon...
