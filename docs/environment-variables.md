## Environment variables

These environment variables should be placed in `.env` for development and
`.env.prod` for production (if you are using the Dockerfile sample).

| Variable                                 | Type   | Description                                                                                                             | Example                     |
| ---------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| NEXT_PUBLIC_FIREBASE_API_KEY             | string | Your firebase API key                                                                                                   |                             |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         | string | Your firebase auth domain                                                                                               |
| NEXT_PUBLIC_FIREBASE_DATABASE_URL        | string | Your firebase database URL                                                                                              |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID          | string | Your firebase project ID                                                                                                |                             |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      | string | Your firebase storage bucket                                                                                            |                             |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | string | Your firebase messaging send ID                                                                                         |                             |
| NEXT_PUBLIC_FIREBASE_APP_ID              | string | Your firebase app ID                                                                                                    |                             |
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID      | string | Youre firebase measurement ID                                                                                           |
| NEXT_PUBLIC_PARSE_APP_ID                 | string | Your Parse app ID, must match what is configured in the Parse server                                                    |                             |
| NEXT_PUBLIC_EXTENSION_ID                 | string | Your **Chrome** extension ID                                                                                            |                             |
| NEXT_PUBLIC_SENTRY_DSN                   | string | URL to send your Sentry events to, if you use Sentry                                                                    |                             |
| NEXT_PUBLIC_WEBSITE_URL                  | string | URL to this instance of the NekoCap website                                                                             | http://localhost:12341/     |
| NEXT_PUBLIC_FONTS_URL                    | string | BaseURL to where your fonts are stored.                                                                                 |                             |
| PARSE_INTERNAL_SERVER_URL                | string | URL for the NextJS **server** (backend only) to connect to the Parse instance                                           | http://localhost:4041/parse |
| NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID       | string | Google Oauth Client ID. Create a project in Google API console and create an Oauth client ID to allow login with Google |                             |
