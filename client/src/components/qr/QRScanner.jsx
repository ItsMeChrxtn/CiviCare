import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ID = 'civicare-qr-scanner';

/** Wraps html5-qrcode's camera scanner; calls onScan(text) once per successful decode. */
const QRScanner = ({ onScan, onError }) => {
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {} // ignore per-frame decode failures
      )
      .then(() => {
        isScanningRef.current = true;
      })
      .catch((err) => onError?.(err));

    return () => {
      if (isScanningRef.current) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={SCANNER_ID} className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl" />;
};

export default QRScanner;
