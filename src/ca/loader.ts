import fs from 'fs';
import path from 'path';

export class CertificateLoader {
  private readonly caPath: string;

  constructor(caPath: string) {
    this.caPath = caPath;
  }

  public loadCACertificate(): string {
    return fs.readFileSync(path.join(this.caPath, 'certs/ca.crt'), 'utf-8');
  }

  public loadServerCertificate(): string {
    return fs.readFileSync(path.join(this.caPath, 'certs/server.crt'), 'utf-8');
  }

  public loadServerKey(): string {
    return fs.readFileSync(path.join(this.caPath, 'private/server.key'), 'utf-8');
  }
}
