import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiSearch } from 'react-icons/fi';
import QRScanner from '../../components/qr/QRScanner';

/** Turns a scanned payload (verify URL or bare reference code) into an in-app verify route. */
const toVerifyPath = (text) => {
  const value = String(text).trim();
  const match = value.match(/verify-document\/([A-Z0-9-]+)(\?h=[a-f0-9]+)?/i);
  if (match) return `/verify-document/${match[1]}${match[2] || ''}`;
  if (/^DOC-\d{4}-\d+$/i.test(value)) return `/verify-document/${value.toUpperCase()}`;
  return null;
};

/** QR Code Verification: scan a barangay document with the browser camera (html5-qrcode). */
const ScanVerify = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handle = (text) => {
    const path = toVerifyPath(text);
    if (!path) return setError('This QR code is not a CiviCare document.');
    setScanning(false);
    navigate(path);
    return null;
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Verify a Barangay Document</h1>
      <p className="mt-2 text-sm text-gray-500">Scan the QR code printed on a Barangay Magdiwang clearance or certificate to check that it is genuine and unaltered.</p>

      <div className="card mt-8 p-6">
        {scanning ? (
          <>
            <QRScanner onScan={handle} onError={() => setError('Camera unavailable. Allow camera access or enter the reference code below.')} />
            <button onClick={() => setScanning(false)} className="btn-secondary mt-4">
              Stop camera
            </button>
          </>
        ) : (
          <button onClick={() => setScanning(true)} className="btn-primary w-full !py-3">
            <FiCamera /> Scan QR Code
          </button>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handle(code);
          }}
          className="mt-6 flex gap-2"
        >
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="or enter reference code, e.g. DOC-2026-000123" className="input-field" />
          <button type="submit" className="btn-secondary shrink-0" aria-label="Verify">
            <FiSearch />
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-4 text-xs text-gray-400">
          Documents issued by CiviCare carry a security code inside the QR, so a full check needs a scan. Typing the reference code only works for older documents.
        </p>
      </div>
    </div>
  );
};

export default ScanVerify;
