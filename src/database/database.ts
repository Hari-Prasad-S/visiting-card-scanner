import * as SQLite from 'expo-sqlite';
import { ContactRecord, ExtractedContact, GreetingChannel, GreetingStatus } from '../types';
import { normalizePhoneNumber } from '../utils/phoneValidator';

const DATABASE_NAME = 'visiting_cards.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Initializes and retrieves SQLite database connection
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await initSchema(dbInstance);
  }
  return dbInstance;
}

/**
 * Creates table and indexes if they do not exist
 */
async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      designation TEXT,
      company_name TEXT,
      phone_number TEXT,
      whatsapp_number TEXT,
      email TEXT,
      website TEXT,
      address TEXT,
      raw_text TEXT,
      scan_date TEXT NOT NULL,
      greeting_channel TEXT DEFAULT 'none',
      greeting_status TEXT DEFAULT 'drafted'
    );
    CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts (phone_number);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);
  `);
}

/**
 * Checks if a contact already exists based on phone number or email
 */
export async function findDuplicateContact(
  phone: string,
  email: string
): Promise<ContactRecord | null> {
  const db = await getDatabase();
  const normalizedPhone = phone ? normalizePhoneNumber(phone).e164 : '';
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!normalizedPhone && !cleanEmail) {
    return null;
  }

  let query = 'SELECT * FROM contacts WHERE 1=0';
  const params: string[] = [];

  if (normalizedPhone) {
    query += ' OR phone_number = ?';
    params.push(normalizedPhone);
  }

  if (cleanEmail) {
    query += ' OR LOWER(email) = ?';
    params.push(cleanEmail);
  }

  query += ' ORDER BY id DESC LIMIT 1';

  const existing = await db.getFirstAsync<ContactRecord>(query, params);
  return existing || null;
}

/**
 * Saves a new contact or updates existing if duplicate
 */
export async function saveOrUpdateContact(
  contact: ExtractedContact,
  channel: GreetingChannel = 'none',
  status: GreetingStatus = 'drafted'
): Promise<{ id: number; isDuplicate: boolean }> {
  const db = await getDatabase();

  const normalizedPhone = contact.phone_number
    ? normalizePhoneNumber(contact.phone_number).e164
    : '';
  const normalizedWhatsApp = contact.whatsapp_number
    ? normalizePhoneNumber(contact.whatsapp_number).e164
    : normalizedPhone;
  const cleanEmail = (contact.email || '').trim().toLowerCase();

  const duplicate = await findDuplicateContact(normalizedPhone, cleanEmail);

  if (duplicate && duplicate.id) {
    // Update existing record
    await db.runAsync(
      `UPDATE contacts SET
        full_name = ?,
        designation = ?,
        company_name = ?,
        phone_number = ?,
        whatsapp_number = ?,
        email = ?,
        website = ?,
        address = ?,
        raw_text = ?,
        scan_date = ?,
        greeting_channel = ?,
        greeting_status = ?
      WHERE id = ?`,
      [
        contact.full_name || duplicate.full_name || '',
        contact.designation || duplicate.designation || '',
        contact.company_name || duplicate.company_name || '',
        normalizedPhone || duplicate.phone_number || '',
        normalizedWhatsApp || duplicate.whatsapp_number || '',
        cleanEmail || duplicate.email || '',
        contact.website || duplicate.website || '',
        contact.address || duplicate.address || '',
        contact.raw_text || duplicate.raw_text || '',
        new Date().toISOString(),
        channel || 'none',
        status || 'drafted',
        duplicate.id,
      ]
    );

    return { id: duplicate.id, isDuplicate: true };
  }

  // Insert new record
  const result = await db.runAsync(
    `INSERT INTO contacts (
      full_name,
      designation,
      company_name,
      phone_number,
      whatsapp_number,
      email,
      website,
      address,
      raw_text,
      scan_date,
      greeting_channel,
      greeting_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      contact.full_name || '',
      contact.designation || '',
      contact.company_name || '',
      normalizedPhone || '',
      normalizedWhatsApp || '',
      cleanEmail || '',
      contact.website || '',
      contact.address || '',
      contact.raw_text || '',
      new Date().toISOString(),
      channel || 'none',
      status || 'drafted',
    ]
  );

  return { id: Number(result.lastInsertRowId), isDuplicate: false };
}

/**
 * Updates greeting status of a contact
 */
export async function updateGreetingStatus(
  id: number,
  channel: GreetingChannel,
  status: GreetingStatus
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE contacts SET greeting_channel = ?, greeting_status = ? WHERE id = ?',
    [channel, status, id]
  );
}

/**
 * Retrieves all saved contacts ordered by recent scan date
 */
export async function getAllContacts(): Promise<ContactRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ContactRecord>(
    'SELECT * FROM contacts ORDER BY id DESC'
  );
  return rows;
}

/**
 * Retrieves single contact by ID
 */
export async function getContactById(id: number): Promise<ContactRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ContactRecord>(
    'SELECT * FROM contacts WHERE id = ?',
    [id]
  );
  return row || null;
}

/**
 * Deletes a contact by ID
 */
export async function deleteContact(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM contacts WHERE id = ?', [id]);
}

/**
 * Gets total count of scanned contacts
 */
export async function getContactsCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM contacts'
  );
  return row ? row.count : 0;
}
