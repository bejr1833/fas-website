# FAS Google Sheets — Contact & Prayer Requests

The public React form submits to Django at `POST /api/contact/`.

Django remains the source of truth in Postgres. When Google Sheets integration is configured, every contact/prayer submission is also appended to a private Google Sheet.

## Google Sheet columns

The integration creates/uses a worksheet named **Contact Requests** with:

1. Submitted At
2. Name
3. Email
4. Phone
5. Request Type
6. Message
7. Status

## Production setup

### 1. Create the Google Sheet

Create a Google Sheet named:

**FAS Contact & Prayer Requests**

Copy the spreadsheet ID from its URL:

`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

### 2. Create a Google Cloud service account

In Google Cloud Console:

1. Create/select a project for FAS.
2. Enable **Google Sheets API**.
3. Create a **Service Account**.
4. Create a JSON key for that service account and download the JSON file.
5. Open the JSON file and copy the service account `client_email`.

Do not commit the JSON file to GitHub.

### 3. Share the Sheet with the service account

In the Google Sheet, click **Share** and add the service account's `client_email` as an **Editor**.

The Sheet should remain private to the FAS team; only the service account needs access.

### 4. Encode the JSON key for Render

On Windows PowerShell, from the folder containing the downloaded JSON key:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\fas-google-sheets-service-account.json"))
```

Copy the resulting single-line value.

### 5. Add Render environment variables

In the **fas-backend** Render service, add:

```text
FAS_GOOGLE_SHEETS_SPREADSHEET_ID=<your spreadsheet id>
FAS_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=<base64 encoded service account JSON>
```

Then redeploy.

## Security

- The Google credential never reaches the React frontend.
- The credential is stored only in Render environment variables.
- The public API does not expose ContactMessage records.
- Django/Postgres stores the request before attempting the Sheets sync.
- If Google Sheets is temporarily unavailable, the prayer request remains safely stored in Postgres and the failure is logged.

## Local development

Set the same two environment variables in `backend/.env` before testing locally.

Never commit `.env` or the service-account JSON key.
