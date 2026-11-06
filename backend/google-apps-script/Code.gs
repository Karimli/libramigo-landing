/**
 * Libramigo waitlist → Google Sheets.
 *
 * Deploy as a web app bound to the waitlist spreadsheet (see backend/README.md).
 * Accepts:
 *   - JSON body sent as text/plain from the landing page script:
 *       { email, lang, source, createdAt }  → responds { ok: true } / { ok: false, error }
 *   - application/x-www-form-urlencoded from the no-JS form fallback → responds with a small HTML page
 * Duplicate emails are not stored twice (the response is still ok: true).
 */

const SHEET_NAME = 'Waitlist';
const HEADERS = ['receivedAt', 'email', 'lang', 'source', 'createdAt'];
const SITE_URL = 'https://libramigo.az';
const LANGS = ['az', 'ru', 'en'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Copy from src/i18n/*.json (waitlist.success / waitlist.errorInvalid), used only for the no-JS page.
const TEXT = {
  az: { success: 'Siyahıya yazıldın. Platforma açılanda sənə yazacağıq.', invalid: 'E-poçt ünvanını düzgün yaz, məsələn ad@numune.az.' },
  ru: { success: 'Вы в списке. Мы напишем, когда платформа откроется.', invalid: 'Введите корректный адрес, например name@example.az.' },
  en: { success: 'You’re on the waitlist. We’ll email you when we open.', invalid: 'Enter a valid email address, like name@example.com.' },
};

function doPost(e) {
  const isForm = !!(e && e.postData && e.postData.type === 'application/x-www-form-urlencoded');
  let data = {};
  try {
    data = isForm ? e.parameter : JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return respond_(false, 'az', { ok: false, error: 'bad_request' });
  }

  const lang = LANGS.indexOf(data.lang) > -1 ? data.lang : 'az';
  const email = String(data.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return respond_(isForm, lang, { ok: false, error: 'invalid_email' });
  }
  const source = String(data.source || 'landing').slice(0, 50);
  const createdAt = String(data.createdAt || '').slice(0, 40);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const last = sheet.getLastRow();
    const existing = last > 1 ? sheet.getRange(2, 2, last - 1, 1).getValues() : [];
    const duplicate = existing.some(function (row) { return String(row[0]).toLowerCase() === email; });
    if (!duplicate) {
      sheet.appendRow([new Date(), safe_(email), lang, safe_(source), safe_(createdAt)]);
      notifyOwner_(email, lang, sheet.getLastRow() - 1);
    }
    return respond_(isForm, lang, { ok: true, duplicate: duplicate });
  } finally {
    lock.releaseLock();
  }
}

// Emails the script owner about each new signup. Sent to the owner's own Google address
// (not to info@libramigo.az: Gmail hides a forwarded copy of a message it has in Sent).
// Reply-To is the subscriber, so "Reply" in Gmail writes to them. A mail failure
// (e.g. daily quota) must never fail the signup itself.
function notifyOwner_(email, lang, total) {
  try {
    const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      replyTo: email,
      name: 'Libramigo waitlist',
      subject: 'Libramigo: yeni qeydiyyat (' + email + ')',
      body:
        'Yeni e-poçt gözləmə siyahısına yazıldı.\n\n' +
        'E-poçt: ' + email + '\n' +
        'Dil: ' + lang + '\n' +
        'Siyahıda cəmi: ' + total + '\n\n' +
        'Cədvəl: ' + sheetUrl,
    });
  } catch (err) {
    console.error('notifyOwner_ failed', err);
  }
}

function doGet() {
  return ContentService.createTextOutput('Libramigo waitlist endpoint').setMimeType(ContentService.MimeType.TEXT);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Prevent formula injection: values starting with = + - @ would be evaluated by Sheets.
function safe_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function respond_(isForm, lang, result) {
  if (!isForm) {
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  const t = TEXT[lang] || TEXT.az;
  const message = result.ok ? t.success : t.invalid;
  const back = SITE_URL + '/' + lang + (result.ok ? '' : '#waitlist');
  const html =
    '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Libramigo</title></head>' +
    '<body style="margin:0;padding:48px 5%;background:#12403C;color:#F4EDE1;font-family:Segoe UI,Arial,sans-serif;font-size:19px;line-height:1.5">' +
    '<p>' + message + '</p><p><a href="' + back + '" target="_top" style="color:#E9A83A">Libramigo</a></p></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}
