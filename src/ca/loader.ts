import fs from 'fs';

export class CertificateLoader {
  private readonly caCertPath: string;

  constructor(caCertPath: string) {
    this.caCertPath = caCertPath;
  }

  public loadCACertificate(): string {
    return fs.readFileSync(this.caCertPath, 'utf-8');
  }
}
