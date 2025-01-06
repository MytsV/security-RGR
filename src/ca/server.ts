import * as net from 'net';
import { CertificateLoader } from './loader';
import crypto from 'crypto';
import {RequestType, ValidationRequest, ValidationResponse} from './types';

export class CAServer {
  private readonly caCert: crypto.X509Certificate;
  private readonly port: number;

  constructor(port: number, caPath: string) {
    const certLoader = new CertificateLoader(caPath);
    this.caCert = new crypto.X509Certificate(certLoader.loadCACertificate());
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
          const response: ValidationResponse = {
            type: RequestType.Validation,
            isValid,
          }
          socket.write(JSON.stringify(response));
        }
      } catch (error) {}
    });
  }

  public validateCertificate(certContents: string): boolean {
    try {
      const cert = new crypto.X509Certificate(certContents);
      return cert.verify(this.caCert.publicKey);
    } catch (error) {
      return false;
    }
  }
}
