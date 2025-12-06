import fetch from 'node-fetch';

class ZohoClient {
  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID;
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET;
    this.refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    this.orgId = process.env.ZOHO_ORG_ID;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Check if current token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Refresh access token
    try {
      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        return this.accessToken;
      }

      throw new Error('Failed to refresh Zoho access token');
    } catch (error) {
      console.error('Zoho token refresh error:', error);
      throw error;
    }
  }

  async createLead(leadData) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await fetch('https://www.zohoapis.com/crm/v2/Leads', {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [leadData],
        }),
      });

      const result = await response.json();
      return result.data?.[0];
    } catch (error) {
      console.error('Zoho create lead error:', error);
      throw error;
    }
  }

  async updateLead(leadId, updates) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await fetch(`https://www.zohoapis.com/crm/v2/Leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [updates],
        }),
      });

      const result = await response.json();
      return result.data?.[0];
    } catch (error) {
      console.error('Zoho update lead error:', error);
      throw error;
    }
  }

  async convertLeadToStudent(leadId, courseId) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await fetch(`https://www.zohoapis.com/crm/v2/Leads/${leadId}/actions/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [{
            overwrite: false,
            notify_lead_owner: true,
            notify_new_entity_owner: false,
            Accounts: null,
            Contacts: null,
            Deals: {
              Deal_Name: `Course Purchase - ${courseId}`,
              Stage: 'Closed Won',
            },
          }],
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Zoho convert lead error:', error);
      throw error;
    }
  }
}

export default new ZohoClient();

