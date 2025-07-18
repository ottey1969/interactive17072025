import { google } from 'googleapis';

// Google Drive URL reading service for Sofeia AI
export class GoogleDriveService {
  private drive: any;
  private docs: any;

  constructor() {
    // Initialize Google APIs with service account or OAuth
    const auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/documents.readonly'
      ],
      // Use environment variable for service account key
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.docs = google.docs({ version: 'v1', auth });
  }

  /**
   * Extract Google Drive file ID from various URL formats
   */
  extractFileId(url: string): string | null {
    const patterns = [
      // Google Docs
      /\/document\/d\/([a-zA-Z0-9-_]+)/,
      // Google Sheets
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      // Google Drive file
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      // Drive view link
      /id=([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Read content from Google Docs
   */
  async readGoogleDoc(fileId: string): Promise<string> {
    try {
      const response = await this.docs.documents.get({
        documentId: fileId
      });

      const doc = response.data;
      let content = '';

      if (doc.body?.content) {
        for (const element of doc.body.content) {
          if (element.paragraph?.elements) {
            for (const textElement of element.paragraph.elements) {
              if (textElement.textRun?.content) {
                content += textElement.textRun.content;
              }
            }
          }
        }
      }

      return content.trim();
    } catch (error) {
      console.error('Error reading Google Doc:', error);
      throw new Error(`Failed to read Google Doc: ${error.message}`);
    }
  }

  /**
   * Get file metadata and content based on URL
   */
  async readFromUrl(url: string): Promise<{ title: string; content: string; type: string }> {
    const fileId = this.extractFileId(url);
    if (!fileId) {
      throw new Error('Invalid Google Drive URL format');
    }

    try {
      // Get file metadata
      const metadata = await this.drive.files.get({
        fileId: fileId,
        fields: 'name,mimeType,size'
      });

      const fileName = metadata.data.name;
      const mimeType = metadata.data.mimeType;

      let content = '';
      let type = 'unknown';

      // Handle different file types
      if (mimeType === 'application/vnd.google-apps.document') {
        content = await this.readGoogleDoc(fileId);
        type = 'document';
      } else if (mimeType === 'text/plain') {
        // Plain text file
        const response = await this.drive.files.get({
          fileId: fileId,
          alt: 'media'
        });
        content = response.data;
        type = 'text';
      } else {
        throw new Error(`Unsupported file type: ${mimeType}. Currently supports Google Docs and plain text files.`);
      }

      return {
        title: fileName,
        content: content,
        type: type
      };
    } catch (error) {
      console.error('Error reading from Google Drive:', error);
      throw new Error(`Failed to read from Google Drive: ${error.message}`);
    }
  }

  /**
   * Check if URL is a valid Google Drive URL
   */
  isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  }
}

export const googleDriveService = new GoogleDriveService();