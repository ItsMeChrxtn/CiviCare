import api from './api';

/** Fetches an authenticated file endpoint and triggers a browser download. */
export const downloadFile = async (url, params, filename) => {
  const { data } = await api.get(url, { params, responseType: 'blob' });
  const href = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(href), 1000);
};
