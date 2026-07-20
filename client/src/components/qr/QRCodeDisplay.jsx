import { useEffect, useState } from 'react';
import api from '../../utils/api';
import Spinner from '../common/Spinner';

/** Shows the current resident's personal QR code (used for event attendance / identity verification). */
const QRCodeDisplay = () => {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    api.get('/users/me/qrcode').then(({ data }) => setQrDataUrl(data.data.qrDataUrl));
  }, []);

  if (!qrDataUrl) {
    return (
      <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <img src={qrDataUrl} alt="My QR Code" className="h-48 w-48" />
      <p className="text-center text-xs text-gray-400">Present this QR code for event attendance check-in.</p>
    </div>
  );
};

export default QRCodeDisplay;
