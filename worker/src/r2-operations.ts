import { Env } from './types';

interface R2ListResponse {
  objects: Array<{
    key: string;
    size: number;
    uploaded: string;
    httpEtag: string;
    checksums?: Record<string, string>;
    customMetadata?: Record<string, string>;
  }>;
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

export class R2Operations {
  private bucket: R2Bucket;

  constructor(env: Env) {
    this.bucket = env.R2_BUCKET;
  }

  /**
   * List objects in the R2 bucket
   */
  async list(prefix: string = '', delimiter: string = '/'): Promise<R2ListResponse> {
    const options: R2ListOptions = {
      prefix,
      delimiter,
      limit: 1000,
    };

    const listed = await this.bucket.list(options);

    // Extract folders from placeholder files
    const placeholderFolders = new Set<string>();
    listed.objects.forEach((obj) => {
      if (obj.key.endsWith('.placeholder')) {
        // Remove the .placeholder suffix to get the folder path
        const folderPath = obj.key.replace('.placeholder', '');
        // Only add if it's within the current prefix
        if (folderPath.startsWith(prefix)) {
          // Get the relative path from the prefix
          const relativePath = folderPath.substring(prefix.length);
          // Only add if it's a direct child (no additional slashes)
          if (!relativePath.includes('/') || relativePath.indexOf('/') === relativePath.lastIndexOf('/')) {
            placeholderFolders.add(folderPath);
          }
        }
      }
    });

    // Combine R2's delimited prefixes with placeholder folders
    const allPrefixes = [...(listed.delimitedPrefixes || [])];
    placeholderFolders.forEach((folder) => {
      if (!allPrefixes.includes(folder)) {
        allPrefixes.push(folder);
      }
    });

    return {
      objects: listed.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
        httpEtag: obj.httpEtag,
        checksums: obj.checksums as unknown as Record<string, string> | undefined,
        customMetadata: obj.customMetadata,
      })),
      truncated: listed.truncated,
      cursor: listed.truncated ? (listed as any).cursor : undefined,
      delimitedPrefixes: allPrefixes.sort(),
    };
  }

  /**
   * Get a specific object from R2
   */
  async get(key: string): Promise<Response> {
    const object = await this.bucket.get(key);

    if (!object) {
      return new Response('Object not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // Set content type based on file extension
    const ext = key.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      md: 'text/markdown; charset=utf-8',
      txt: 'text/plain; charset=utf-8',
      json: 'application/json; charset=utf-8',
      html: 'text/html; charset=utf-8',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };

    if (ext && contentTypes[ext]) {
      headers.set('Content-Type', contentTypes[ext]);
    }

    return new Response(object.body, { headers });
  }

  /**
   * Upload an object to R2
   */
  async put(
    key: string,
    body: ReadableStream | ArrayBuffer | string,
    metadata?: Record<string, string>,
  ): Promise<Response> {
    try {
      const options: R2PutOptions = {
        customMetadata: metadata,
      };

      await this.bucket.put(key, body, options);

      return new Response(
        JSON.stringify({
          success: true,
          message: `File ${key} uploaded successfully`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to upload: ${error}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  /**
   * Delete an object from R2
   */
  async delete(key: string): Promise<Response> {
    try {
      await this.bucket.delete(key);

      return new Response(
        JSON.stringify({
          success: true,
          message: `File ${key} deleted successfully`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to delete: ${error}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  /**
   * Create a folder (by creating a placeholder object)
   */
  async createFolder(path: string): Promise<Response> {
    if (!path.endsWith('/')) {
      path += '/';
    }

    try {
      // Create a zero-byte object to represent the folder
      await this.bucket.put(`${path}.placeholder`, '', {
        customMetadata: { type: 'folder' },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Folder ${path} created successfully`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create folder: ${error}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  /**
   * Get object metadata
   */
  async head(key: string): Promise<Response> {
    const object = await this.bucket.head(key);

    if (!object) {
      return new Response('Object not found', { status: 404 });
    }

    return new Response(
      JSON.stringify({
        key: object.key,
        size: object.size,
        uploaded: object.uploaded.toISOString(),
        httpEtag: object.httpEtag,
        checksums: object.checksums,
        customMetadata: object.customMetadata,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
