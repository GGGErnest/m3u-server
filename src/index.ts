import express, { Request, Response } from 'express';
import cron from 'node-cron';
import axios from 'axios';
import * as asyncFs from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { applyFilters, exportToM3U, parse } from './parser';
import filters from './filters.json';

interface Config {
  port: number;
  sourceFilePath: string;
  filteredFilePath: string;
  downloadUrl: string;
  blacklistedKeywords: string[];
  validExtensions: string[];
}

class M3UServer {
  private readonly config: Config;
  private readonly app: express.Application;
  private readonly _filters = filters.filters;

  constructor(config: Config) {
    this.config = config;
    this.app = express();
    this.setupRoutes();
  }


  private setupRoutes(): void {
    this.app.get('/playlist', this.servePlaylist.bind(this));
    this.app.post('/update', this.handleManualUpdate.bind(this));
  }

  private async downloadAndProcessFile(): Promise<void> {
    try {
      console.log('Starting M3U file download...');

      const writer = fs.createWriteStream(this.config.sourceFilePath);

      const response = await axios.get(this.config.downloadUrl, { responseType: 'stream' });

      // Pipe the downloaded data directly to the writable stream
      response.data.pipe(writer);

      // Wait for the write stream to finish
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      console.log('M3U file downloaded successfully, starting processing...');

      const entries = await parse(this.config.sourceFilePath);
      const filteredEntries = applyFilters(entries, this._filters);

      await exportToM3U(filteredEntries, this.config.filteredFilePath);
      console.log('M3U file processed and filtered successfully');
    } catch (error) {
      console.error('Error processing M3U file:', error);
      throw error;
    }
  }

  private async updateFilters(req: Request, res: Response): Promise<void> {
    try {
      const newFilters = req.body;
    } catch (error) {
      console.error('Error updating playlist:', error);
      res.status(500).json({ error: 'Error updating playlist' });
    }
  }

  private async servePlaylist(req: Request, res: Response): Promise<void> {
    try {
      const content = await asyncFs.readFile(this.config.filteredFilePath, 'utf8');
      res.setHeader('Content-Type', 'application/x-mpegurl');
      res.send(content);
    } catch (error) {
      console.error('Error serving M3U file:', error);
      res.status(500).send('Error serving playlist');
    }
  }

  private async handleManualUpdate(req: Request, res: Response): Promise<void> {
    try {
      await this.downloadAndProcessFile();
      res.json({ message: 'Playlist updated successfully' });
    } catch (error) {
      console.error('Error updating playlist:', error);
      res.status(500).json({ error: 'Error updating playlist' });
    }
  }

  private async initialize(): Promise<void> {
    try {
      await this.downloadAndProcessFile();
    } catch (error) {
      console.error('Error during initialization:', error);
      // Create empty files if download fails
      await asyncFs.writeFile(this.config.sourceFilePath, '#EXTM3U\n');
      await asyncFs.writeFile(this.config.filteredFilePath, '#EXTM3U\n');
    }
  }

  public async start(): Promise<void> {
    await this.initialize();
    this.app.listen(this.config.port, () => {
      console.log(`M3U Server running at http://localhost:${this.config.port}`);
      console.log(`Access filtered playlist at http://localhost:${this.config.port}/playlist`);
    });

    // Schedule daily download
    cron.schedule('0 0 * * *', () => this.downloadAndProcessFile());
  }
}

// Configuration
const config: Config = {
  port: 3000,
  sourceFilePath: path.join(__dirname, 'source.m3u'),
  filteredFilePath: path.join(__dirname, 'filtered.m3u'),
  downloadUrl: 'http://tvstation.cc/get.php?username=78KD7A2&password=35D2H4Y&type=m3u&output=mpegts', // Replace with your M3U URL
  blacklistedKeywords: ['ads', 'commercials', 'teleshopping'],
  validExtensions: ['.ts', '.m3u8', '.mp4']
};

// Create and start the server
const server = new M3UServer(config);
server.start().catch(console.error);
