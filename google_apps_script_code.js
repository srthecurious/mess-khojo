/**
 * MessKhojo — Google Apps Script for Google Sheets Two-Way Sync + Diallogs Webhook
 *
 * Deploy this script as a Web App:
 * 1. Open Google Sheets (MessKhojo_Freelancer_Calling_Board or Master)
 * 2. Extensions > Apps Script
 * 3. Paste this entire code into Code.gs
 * 4. Project Settings > Script Properties > Add:
 *    - WEBHOOK_SECRET: your_chosen_secret (e.g. mk_sync_secret_2026)
 *    - WORK_SIMS: 9692819621,9876500001 (or JSON format)
 * 5. Deploy > Manage Deployments > Edit > New Version > Deploy
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App Deployment URL and put it in .env as VITE_GOOGLE_SHEET_WEBHOOK_URL
 */

const CALLING_SHEET    = "Calling_Tasks";
const MASTER_SHEET     = "Messes_Master";
const MIN_VERIFIED_SEC = 30;

function normalizePhone(raw) {
  if (!raw) return '';
  const d = String(raw).replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : d;
}

function getWorkSIMs() {
  const raw = PropertiesService.getScriptProperties().getProperty('WORK_SIMS') || '';
  const simsMap = {};
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      parsed.forEach(num => {
        const clean = normalizePhone(num);
        if (clean) simsMap[clean] = clean;
      });
    } else if (typeof parsed === 'object' && parsed !== null) {
      Object.keys(parsed).forEach(k => {
        const clean = normalizePhone(k);
        if (clean) simsMap[clean] = parsed[k];
      });
    } else if (typeof parsed === 'number') {
      const clean = normalizePhone(parsed);
      if (clean) simsMap[clean] = clean;
    }
  } catch (_) {}

  // Fallback for single numbers or comma-separated strings
  if (Object.keys(simsMap).length === 0 && raw) {
    String(raw).split(',').forEach(num => {
      const clean = normalizePhone(num.trim());
      if (clean) simsMap[clean] = clean;
    });
  }
  return simsMap;
}

function getSecret() {
  return PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
}

// ── Main Entrypoint (POST) ───────────────────────────────────────────────────
function doPost(e) {
  try {
    console.log("doPost triggered. Query params:", JSON.stringify(e && e.parameter));
    let body = {};
    try {
      if (e && e.postData && e.postData.contents) {
        console.log("Raw POST contents:", e.postData.contents);
        body = JSON.parse(e.postData.contents);
      }
    } catch (err) {
      console.error("Failed to parse POST body JSON:", err);
      body = {};
    }

    const expectedSecret = getSecret();
    const providedSecret = (e && e.parameter && e.parameter.secret) ||
                           body.secret ||
                           body.secret_key ||
                           body.secretKey ||
                           body.key ||
                           body.token;

    if (expectedSecret && providedSecret !== expectedSecret) {
      console.warn("Unauthorized request. Expected:", expectedSecret, "Provided:", providedSecret);
      return ContentService.createTextOutput(JSON.stringify({ status: 'unauthorized', message: 'Secret mismatch' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Branch 1: Website pushes all messes to Admin Master Sheet
    if (body.action === 'sync_messes') {
      return handleDashboardSync(body);
    }

    // Branch 2: Website exports tasks to Freelancer Calling Sheet
    if (body.action === 'export_calling_tasks') {
      return handleExportCallingTasks(body);
    }

    // Branch 3: Diallogs call webhook fires
    return handleDiallogsWebhook(body);
  } catch (fatalErr) {
    console.error("Fatal error in doPost:", fatalErr);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: fatalErr.message || String(fatalErr)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Diallogs Webhook Handler ─────────────────────────────────────────────────
function handleDiallogsWebhook(payload) {
  console.log("Processing Diallogs payload:", JSON.stringify(payload));
  const workSIMs   = getWorkSIMs();
  const rawCaller  = payload.caller_number || payload.caller || payload.from || payload.sim_number || payload.agent_number || payload.mobile || payload.callerNumber || '';
  const callerNorm = normalizePhone(rawCaller);

  console.log("Caller normalized:", callerNorm, "Registered Work SIMs:", JSON.stringify(workSIMs));

  // Filter 1: If caller is not in authorized work SIMs, ignore (Personal SIM safeguard)
  if (Object.keys(workSIMs).length > 0 && !workSIMs[callerNorm]) {
    console.warn("Ignored: Caller " + callerNorm + " not in registered Work SIMs.");
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ignored', reason: 'Personal SIM or untracked caller: ' + callerNorm
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const rawRecipient  = payload.recipient_number || payload.recipient || payload.to || payload.phone || payload.contact || payload.client_number || payload.customer_phone || payload.number || payload.recipientNumber || '';
  const recipientNorm = normalizePhone(rawRecipient);
  console.log("Recipient normalized:", recipientNorm);

  if (!recipientNorm) {
    console.warn("Ignored: No recipient found in payload");
    return ContentService.createTextOutput(JSON.stringify({ status: 'ignored', reason: 'No recipient' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const durationSec = Number(payload.duration_seconds || payload.call_duration_seconds || payload.duration || payload.call_duration || payload.callDuration || 0);
  const recording   = payload.recording_url || payload.recording || payload.audio_url || payload.record_url || '';
  const callType    = String(payload.type || payload.call_type || payload.direction || 'OUTGOING').toUpperCase();

  console.log("Call Type:", callType, "Duration:", durationSec, "Recording:", recording);

  // Filter 2: Ignore pure incoming owner calls if needed
  if (callType.includes('INCOMING')) {
    console.warn("Ignored: Incoming call");
    return ContentService.createTextOutput(JSON.stringify({ status: 'ignored', reason: 'Incoming call' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Verification categorization
  let badge = '❌ NOT ANSWERED';
  if (durationSec >= MIN_VERIFIED_SEC) {
    badge = '✅ VERIFIED';
  } else if (durationSec > 0) {
    badge = '⚠️ SHORT (' + durationSec + 's)';
  }

  const durStr = Math.floor(durationSec / 60) + 'm ' + (durationSec % 60) + 's';
  const ts     = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd-MMM hh:mm a');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CALLING_SHEET);
  if (!sheet) {
    sheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === CALLING_SHEET.toLowerCase());
  }
  if (!sheet) {
    console.error("Sheet tab '" + CALLING_SHEET + "' not found in spreadsheet!");
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', reason: 'Sheet tab not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) {
    console.warn("Sheet is empty or has no data rows");
    return ContentService.createTextOutput(JSON.stringify({ status: 'ignored', reason: 'Empty sheet' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Dynamically resolve column indexes from the header row
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
  const colOwnerPhone = headers.indexOf('Owner Phone') + 1;
  const colVerify     = headers.indexOf('Call Verification') + 1;
  const colDuration   = headers.indexOf('Call Duration') + 1;
  const colAttempts   = headers.indexOf('Call Attempts') + 1;
  const colTime       = headers.indexOf('Call Time') + 1;
  const colRecording  = headers.indexOf('Recording') + 1;

  console.log("Detected headers: Owner Phone col=" + colOwnerPhone + ", Call Verification col=" + colVerify);

  if (colOwnerPhone === 0 || colVerify === 0) {
    console.error("Required headers 'Owner Phone' or 'Call Verification' missing!");
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', reason: 'Required headers not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const phoneValues = sheet.getRange(2, colOwnerPhone, lastRow - 1, 1).getValues();
    const matchedRows = [];

    for (let i = 0; i < phoneValues.length; i++) {
      if (normalizePhone(phoneValues[i][0]) === recipientNorm) {
        matchedRows.push(i + 2); // 1-indexed sheet row
      }
    }

    console.log("Matched rows for " + recipientNorm + ":", JSON.stringify(matchedRows));

    if (matchedRows.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'no_match', recipient: recipientNorm
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Update all matching rows (both parent mess row and child room rows)
    matchedRows.forEach(r => {
      const curBadge = String(sheet.getRange(r, colVerify).getValue() || '');
      const curAttempts = Number(colAttempts > 0 ? sheet.getRange(r, colAttempts).getValue() : 0) || 0;
      const newAttempts = curAttempts + 1;

      // 🛡️ STICKY VERIFICATION RULE:
      // If row is already ✅ VERIFIED, an unanswered or short callback must NEVER downgrade it!
      let finalBadge = badge;
      if (curBadge.includes('VERIFIED') && !badge.includes('VERIFIED')) {
        finalBadge = curBadge; // Retain verified status
      }

      sheet.getRange(r, colVerify).setValue(finalBadge);
      if (colDuration > 0 && (!curBadge.includes('VERIFIED') || finalBadge === badge)) {
        sheet.getRange(r, colDuration).setValue(durStr);
      }
      if (colAttempts > 0) sheet.getRange(r, colAttempts).setValue(newAttempts);
      if (colTime > 0) sheet.getRange(r, colTime).setValue(ts);
      if (recording && colRecording > 0) sheet.getRange(r, colRecording).setValue(recording);
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success', updatedRows: matchedRows.length, verification: badge, duration: durStr
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ── Dashboard Sync Push Handler (Website → Admin Master Sheet) ───────────────
function handleDashboardSync(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MASTER_SHEET);
  
  // Set or update headers if column count changed
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() !== payload.headers.length) {
    sheet.getRange(1, 1, 1, payload.headers.length).setValues([payload.headers]);
  }

  const lastRow = sheet.getLastRow();
  const existingIds = {};
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach(([id], idx) => {
      if (id) existingIds[String(id).trim()] = idx + 2;
    });
  }

  let inserted = 0, updated = 0;
  payload.rows.forEach(row => {
    const messId = String(row[0]).trim();
    if (!messId) return;
    if (existingIds[messId]) {
      sheet.getRange(existingIds[messId], 1, 1, row.length).setValues([row]);
      attachMessIdMetadata(sheet, existingIds[messId], messId);
      updated++;
    } else {
      sheet.appendRow(row);
      attachMessIdMetadata(sheet, sheet.getLastRow(), messId);
      inserted++;
    }
  });
  lock.releaseLock();

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', inserted, updated }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Export to Freelancer Sheet with Hierarchical Collapsible Room Grouping ────
function handleExportCallingTasks(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let callingSheet = ss.getSheetByName(CALLING_SHEET);
    if (!callingSheet) {
      callingSheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === CALLING_SHEET.toLowerCase());
    }
    if (!callingSheet) {
      callingSheet = ss.insertSheet(CALLING_SHEET);
    }

    const CALLING_HEADERS = [
      'Task Code',               // Col 1 (A)
      'Mess / Room Title',       // Col 2 (B)
      'Owner Phone',             // Col 3 (C)
      'Room ID',                 // Col 4 (D)
      'Current Rent',            // Col 5 (E)
      'Updated Rent (New)',      // Col 6 (F)  <- Freelancer Input
      'Current Vacancies',       // Col 7 (G)
      'Updated Vacancies (New)', // Col 8 (H)  <- Freelancer Input
      'Call Verification',       // Col 9 (I)  <- Diallogs Webhook
      'Call Duration',           // Col 10 (J)
      'Call Attempts',           // Col 11 (K)
      'Call Time',               // Col 12 (L)
      'Notes / Remarks',         // Col 13 (M) <- Freelancer Input
      'Recording',               // Col 14 (N)
      'Mess ID'                  // Col 15 (O)
    ];

    // Step 1: Preserve existing freelancer inputs & call verification from previous runs
    const existingInputs = {};
    const oldLastRow = callingSheet.getLastRow();
    if (oldLastRow > 1) {
      const data = callingSheet.getDataRange().getValues();
      const h = data[0].map(val => String(val || '').trim());
      const rIdCol   = h.indexOf('Room ID');
      const codeCol  = h.indexOf('Task Code');
      const phoneCol = h.indexOf('Owner Phone');
      const uRentCol = h.indexOf('Updated Rent (New)');
      const uVacCol  = h.indexOf('Updated Vacancies (New)');
      const vCol     = h.indexOf('Call Verification');
      const durCol   = h.indexOf('Call Duration');
      const attCol   = h.indexOf('Call Attempts');
      const timeCol  = h.indexOf('Call Time');
      const remCol   = h.indexOf('Notes / Remarks');
      const recCol   = h.indexOf('Recording');

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const roomId = rIdCol >= 0 ? String(row[rIdCol] || '').trim() : '';
        const code   = codeCol >= 0 ? String(row[codeCol] || '').trim().toUpperCase() : '';
        const phone  = phoneCol >= 0 ? normalizePhone(row[phoneCol]) : '';

        const entry = {
          updatedRent: uRentCol >= 0 ? row[uRentCol] : '',
          updatedVac:  uVacCol >= 0 ? row[uVacCol] : '',
          verify:      vCol >= 0 ? row[vCol] : '',
          duration:    durCol >= 0 ? row[durCol] : '',
          attempts:    attCol >= 0 ? row[attCol] : '',
          time:        timeCol >= 0 ? row[timeCol] : '',
          remarks:     remCol >= 0 ? row[remCol] : '',
          recording:   recCol >= 0 ? row[recCol] : ''
        };

        if (roomId && roomId !== '—') existingInputs['RM_' + roomId] = entry;
        if (code) existingInputs['CODE_' + code] = entry;
        if (phone && !existingInputs['PHONE_' + phone]) existingInputs['PHONE_' + phone] = entry;
      }
    }

    // Step 2: Safely unfreeze and remove row groups
    try {
      callingSheet.setFrozenRows(0);
      const maxR = callingSheet.getMaxRows();
      for (let d = 0; d < 3; d++) {
        callingSheet.getRange(1, 1, maxR, 1).shiftRowGroupDepth(-1);
      }
    } catch (_) {}

    // Step 3: Clear and format sheet headers
    callingSheet.clear();

    // Ensure grid has enough columns
    const neededCols = CALLING_HEADERS.length + 2;
    if (callingSheet.getMaxColumns() < neededCols) {
      callingSheet.insertColumnsAfter(callingSheet.getMaxColumns(), neededCols - callingSheet.getMaxColumns());
    }

    callingSheet.getRange(1, 1, 1, CALLING_HEADERS.length).setValues([CALLING_HEADERS]);
    try {
      callingSheet.getRange(1, 1, 1, CALLING_HEADERS.length)
        .setBackground('#1e293b')
        .setFontColor('#ffffff')
        .setFontWeight('bold')
        .setFontFamily('Inter');
    } catch (_) {}

    // Step 4: Build hierarchical rows (Parent Mess Row + Collapsible Child Room Rows)
    const allRows = [];
    const groupRanges = [];
    const parentRowIndices = [];
    let addedMesses = 0;

    (payload.tasks || []).forEach(t => {
      const isExplicitlyNo = t.assignToFreelancer === false ||
                             String(t.assignToFreelancer || '').trim().toLowerCase() === 'no' ||
                             String(t.assignToFreelancer || '').trim().toLowerCase() === 'false';
      if (isExplicitlyNo) return;

      const isExplicitlyYes = t.assignToFreelancer === true ||
                              String(t.assignToFreelancer || '').trim().toLowerCase() === 'yes' ||
                              String(t.assignToFreelancer || '').trim().toLowerCase() === 'true';

      if (t.hidden && !isExplicitlyYes) return;

      const cleanPhone = normalizePhone(t.contact);
      const prevMess = existingInputs['CODE_' + String(t.taskCode || '').trim().toUpperCase()]
                    || existingInputs['PHONE_' + cleanPhone]
                    || {};

      const parentRowIdx = allRows.length + 2; // 1-indexed, row 1 is header
      parentRowIndices.push(parentRowIdx);

      const parentRow = [
        t.taskCode,
        '🏢 ' + (t.name || 'Mess') + (t.locality ? ' (' + t.locality + ')' : ''),
        t.contact || '',
        '—',
        t.avgRent ? '₹' + t.avgRent + ' avg' : '—',
        '',
        t.totalVac !== undefined ? t.totalVac + ' total' : '—',
        '',
        prevMess.verify || '⏳ PENDING',
        prevMess.duration || '',
        prevMess.attempts || 0,
        prevMess.time || '',
        prevMess.remarks || '',
        prevMess.recording || '',
        t.id
      ];
      allRows.push(parentRow);
      addedMesses++;

      const rooms = Array.isArray(t.rooms) ? t.rooms : [];
      if (rooms.length > 0) {
        const childStartRow = allRows.length + 2;
        rooms.forEach(r => {
          const prevRoom = existingInputs['RM_' + r.roomId]
                        || existingInputs['CODE_' + String(r.taskCode || '').trim().toUpperCase()]
                        || {};

          const roomVerify = prevRoom.verify || prevMess.verify || '⏳ PENDING';
          const roomDur    = prevRoom.duration || prevMess.duration || '';
          const roomAtt    = prevRoom.attempts || prevMess.attempts || 0;
          const roomTime   = prevRoom.time || prevMess.time || '';
          const roomRec    = prevRoom.recording || prevMess.recording || '';

          const childRow = [
            r.taskCode,
            '  🛏️ ' + r.title,
            t.contact || '',
            r.roomId,
            r.currentRent ? '₹' + r.currentRent : '—',
            prevRoom.updatedRent || '',
            r.currentVacancies !== undefined ? r.currentVacancies : '0',
            prevRoom.updatedVac !== undefined ? prevRoom.updatedVac : '',
            roomVerify,
            roomDur,
            roomAtt,
            roomTime,
            prevRoom.remarks || '',
            roomRec,
            t.id
          ];
          allRows.push(childRow);
        });

        groupRanges.push({ startRow: childStartRow, count: rooms.length });
      }
    });

    // Step 5: Render rows and apply styles & collapsible grouping
    if (allRows.length > 0) {
      // Ensure grid has enough rows before setting values
      const neededRows = allRows.length + 20;
      if (callingSheet.getMaxRows() < neededRows) {
        callingSheet.insertRowsAfter(callingSheet.getMaxRows(), neededRows - callingSheet.getMaxRows());
      }

      callingSheet.getRange(2, 1, allRows.length, CALLING_HEADERS.length).setValues(allRows);

      // Parent Rows styling: Light Indigo/Slate accent, bold
      try {
        parentRowIndices.forEach(pRow => {
          callingSheet.getRange(pRow, 1, 1, CALLING_HEADERS.length)
            .setBackground('#f1f5f9')
            .setFontWeight('bold');
        });
        callingSheet.getRange(2, 6, allRows.length, 1).setBackground('#fefce8');
        callingSheet.getRange(2, 8, allRows.length, 1).setBackground('#f0fdf4');
      } catch (styleErr) {
        console.warn("Styling non-fatal error:", styleErr);
      }

      // Collapsible row grouping: Group rooms under parent mess
      try {
        groupRanges.forEach(grp => {
          callingSheet.getRange(grp.startRow, 1, grp.count, 1).shiftRowGroupDepth(1);
        });
        callingSheet.setRowGroupControlPosition(SpreadsheetApp.GroupControlPosition.BEFORE);
        callingSheet.collapseAllRowGroups();
      } catch (grpErr) {
        console.warn("Grouping non-fatal error:", grpErr);
      }

      try {
        callingSheet.setFrozenRows(1);
        for (let c = 1; c <= Math.min(13, callingSheet.getMaxColumns()); c++) {
          callingSheet.autoResizeColumn(c);
        }
      } catch (_) {}
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      added: addedMesses,
      totalRows: allRows.length,
      collapsibleGroups: groupRanges.length
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ── GET Handler (Sheet → Dashboard Pull) ──────────────────────────────────────
function doGet(e) {
  try {
    const secret = (e && e.parameter && e.parameter.secret) || '';
    if (secret !== getSecret()) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized: Invalid secret' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const target = (e && e.parameter && e.parameter.target) || 'calling';
    const sheetName = target === 'master' ? MASTER_SHEET : CALLING_SHEET;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Active spreadsheet not accessible' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    let sheet = ss.getSheetByName(sheetName);
    // Case-insensitive fallback lookup for tab name (e.g. calling_tasks vs Calling_Tasks)
    if (!sheet) {
      sheet = ss.getSheets().find(s => s.getName().trim().toLowerCase() === sheetName.toLowerCase());
    }
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet tab "' + sheetName + '" not found in spreadsheet.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const headers = data[0];
    const result  = data.slice(1).map((row, rowIdx) => {
      const item = {};
      headers.forEach((h, ci) => { if (h) item[h.trim()] = row[ci]; });
      const messId = getMessIdFromRow(sheet, rowIdx + 2);
      if (messId) item['firestoreMessId'] = messId;
      return item;
    });
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── DeveloperMetadata Helpers ─────────────────────────────────────────────────
function attachMessIdMetadata(sheet, rowNumber, messId) {
  try {
    const range = sheet.getRange(rowNumber, 1);
    const ex    = range.getDeveloperMetadata().find(m => m.getKey() === 'firestoreMessId');
    if (ex) ex.setValue(messId);
    else range.addDeveloperMetadata('firestoreMessId', messId);
  } catch (_) {}
}

function getMessIdFromRow(sheet, rowNumber) {
  try {
    const meta = sheet.getRange(rowNumber, 1).getDeveloperMetadata();
    return meta.find(m => m.getKey() === 'firestoreMessId')?.getValue() || null;
  } catch (_) { return null; }
}
