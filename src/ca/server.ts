import * as net from 'net';
import { CertificateLoader } from './loader';
import crypto from 'crypto';
import { RequestType, ValidationRequest } from './types';

export class CAServer {
  private readonly caCert: string;
  private readonly port: number;

  constructor(port: number, caPath: string) {
    const certLoader = new CertificateLoader(caPath);
    this.caCert = certLoader.loadCACertificate();
    this.port = port;
  }

  public start() {
    const server = net.createServer(this.handleConnection.bind(this));
    server.listen(this.port, () => {
      console.log(`CA Server listening on port ${this.port}`);
    });
  }

  private handleConnection(socket: net.Socket) {
    socket.on('data', (data) => {
      try {
        const request = JSON.parse(data.toString()) as ValidationRequest;

        if (request.type === RequestType.Validation) {
          const isValid = this.validateCertificate(request.certificate);
          console.log(isValid);
        }
      } catch (error) {}
    });
  }

  public validateCertificate(cert: string): boolean {
    try {
      const certBuffer = Buffer.from(cert);
      return crypto.verify(
        'SHA256',
        certBuffer,
        {
          key: this.caCert,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        certBuffer,
      );
    } catch (error) {
      return false;
    }
  }
}
