import {
  saveOrUpdateContact,
  getAllContacts,
  getContactById,
  deleteContact,
  getContactsCount,
  updateGreetingStatus,
  findDuplicateContact,
} from '../database/database';
import { ContactRecord, ExtractedContact, GreetingChannel, GreetingStatus } from '../types';

/**
 * Storage service providing unified interface for local SQLite and optional FastAPI cloud sync
 */
export const storageService = {
  // Configurable backend URL (defaults to empty string for offline local-first SQLite)
  backendUrl: '',

  async saveContact(
    contact: ExtractedContact,
    channel: GreetingChannel = 'none',
    status: GreetingStatus = 'drafted'
  ): Promise<{ id: number; isDuplicate: boolean }> {
    const result = await saveOrUpdateContact(contact, channel, status);

    // Optional background sync with FastAPI backend if configured
    if (this.backendUrl) {
      try {
        await fetch(`${this.backendUrl}/api/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...contact, greeting_channel: channel, greeting_status: status }),
        });
      } catch (err) {
        console.warn('Optional FastAPI backend sync omitted / unreachable:', err);
      }
    }

    return result;
  },

  async getContacts(): Promise<ContactRecord[]> {
    return await getAllContacts();
  },

  async getContact(id: number): Promise<ContactRecord | null> {
    return await getContactById(id);
  },

  async updateGreeting(id: number, channel: GreetingChannel, status: GreetingStatus): Promise<void> {
    await updateGreetingStatus(id, channel, status);

    if (this.backendUrl) {
      try {
        await fetch(`${this.backendUrl}/api/contacts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ greeting_channel: channel, greeting_status: status }),
        });
      } catch (err) {
        console.warn('Optional FastAPI backend status sync skipped:', err);
      }
    }
  },

  async removeContact(id: number): Promise<void> {
    await deleteContact(id);
  },

  async getCount(): Promise<number> {
    return await getContactsCount();
  },

  async checkDuplicate(phone: string, email: string): Promise<ContactRecord | null> {
    return await findDuplicateContact(phone, email);
  },
};

