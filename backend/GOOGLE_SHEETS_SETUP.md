# FAS Google Sheets — Contact & Prayer Requests

The public React form submits to Django at `POST /api/contact/`.

Django/Postgres remains the **source of truth**. When configured, Django sends each
new contact/prayer request to a Google Apps Script web app, which appends it to a
private Google Sheet owned by the FAS admin.

This approach does **not** require a Google Cloud service account or service-account
JSON key.

## Google Sheet columns

The Apps Script creates/uses a worksheet named **Contact Requests** with:

1. Submitted At
2. Name
3. Email
4. Phone
5. Request Type
6. Message
7. Status

## Production setup

### 1. Create the Google Sheet

Using the FAS admin's Google account, create:

**FAS Contact & Prayer Requests**

Copy the spreadsheet ID from:

`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

Keep the Sheet private to the FAS team.

### 2. Open Apps Script from the Sheet

In the Google Sheet:

**Extensions → Apps Script**

Delete the default code and paste the following:

```javascript
const WORKSHEET_NAME = "Contact Requests";
const HEADERS = [
  "Submitted At",
  "Name",
  "Email",
  "Phone",
  "Request Type",
  "Message",
  "Status"
];

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeCell(value) {
  const text = value == null ? "" : String(value);
  // Prevent submitted text from being interpreted as a spreadsheet formula.
  return /^[=+\\-@]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedToken = properties.getProperty("FAS_SYNC_TOKEN");
    const spreadsheetId = properties.getProperty("FAS_SPREADSHEET_ID");

    if (!expectedToken || !spreadsheetId) {
      return jsonResponse({ ok: false, error: "Apps Script is not configured" });
    }

    const payload = JSON.parse(e.postData.contents || "{}");

    if (!payload.token || payload.token !== expectedToken) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      let sheet = spreadsheet.getSheetByName(WORKSHEET_NAME);

      if (!sheet) {
        sheet = spreadsheet.insertSheet(WORKSHEET_NAME);
      }

      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
        sheet.setFrozenRows(1);
      }

      const row = [
        payload.submitted_at || "",
        payload.name || "",
        payload.email || "",
        payload.phone || "",
        payload.request_type || "",
        payload.message || "",
        payload.status || "New"
      ].map(safeCell);

      const nextRow = sheet.getLastRow() + 1;
      sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

      return jsonResponse({ ok: true });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      error: "Unable to save request"
    });
  }
}

function doGet() {
  return jsonResponse({
    ok: true,
    service: "FAS Contact & Prayer Requests"
  });
}
```

Click **Save**.

### 3. Add the two Script Properties

In Apps Script:

**Project Settings → Script Properties → Add script property**

Add:

**Property 1**
- Name: `FAS_SYNC_TOKEN`
- Value: a long random secret

You can generate one in PowerShell:

```powershell
[guid]::NewGuid().ToString("N")
```

**Property 2**
- Name: `FAS_SPREADSHEET_ID`
- Value: your Google Sheet's spreadsheet ID

Do not commit these values to GitHub.

### 4. Deploy as a Web App

In Apps Script:

**Deploy → New deployment**

Select:

**Web app**

Use:

- **Execute as:** Me (the FAS admin Google account that owns the Sheet)
- **Who has access:** Anyone

Then click **Deploy** and copy the **Web app URL**.

Google's Apps Script documentation confirms that versioned web-app deployments are created through **Deploy → New deployment**, and that the deployment exposes a web-app URL. citeturn0search0

### 5. Add two Render environment variables

In the Render service **fas-backend**, add:

```text
FAS_GOOGLE_APPS_SCRIPT_URL=<your Apps Script web-app URL>
FAS_GOOGLE_APPS_SCRIPT_TOKEN=<the same secret used for FAS_SYNC_TOKEN>
```

Then redeploy the backend.

### 6. Test

Open the Apps Script Web App URL in a browser.

It should return JSON similar to:

```json
{"ok":true,"service":"FAS Contact & Prayer Requests"}
```

Then submit a test prayer request through:

**FAS website → Contact Us → Prayer Request**

The request should appear in:

**FAS Contact & Prayer Requests → Contact Requests**

## Architecture

```
FAS Website
    ↓
Django /api/contact/
    ↓
PostgreSQL  ← source of truth
    ↓
Google Apps Script Web App
    ↓
FAS Admin's Google Sheet
```

The React frontend never receives Google credentials.

## Security

- The Sheet remains private to the FAS admin/team.
- Apps Script executes as the FAS admin account.
- Django sends a secret token with each request.
- The secret is stored in Render environment variables and Apps Script Script Properties.
- Django saves the request before attempting the Sheets sync.
- If Google Sheets is unavailable, the request remains safely stored in Postgres.
- Never put the token, Google account password, or any private credentials in the React frontend or GitHub.
