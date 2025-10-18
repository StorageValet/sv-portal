import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';

interface QRCodeDisplayProps {
  item: {
    qr_code: string;
    label: string;
  };
}

export default function QRCodeDisplay({ item }: QRCodeDisplayProps) {
  const qrRef = useRef<SVGSVGElement>(null);

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${item.qr_code}_${item.label}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const printQR = () => {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
          printWindow.document.write('<html><head><title>Print QR Code</title></head><body>');
          printWindow.document.write(`<h2>${item.label} (${item.qr_code})</h2>`);
          printWindow.document.write(qrRef.current?.outerHTML || '');
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.print();
      }
  }

  return (
    <div className="text-center p-4">
      <h3 className="font-bold text-lg">{item.label}</h3>
      <p className="text-sm text-gray-500 mb-4">{item.qr_code}</p>
      <div className="flex justify-center">
        <QRCodeSVG value={item.qr_code} size={256} ref={qrRef} />
      </div>
      <div className="mt-6 flex justify-center space-x-4">
        <button onClick={downloadQR} className="text-sm font-medium text-indigo-600">Download PNG</button>
        <button onClick={printQR} className="text-sm font-medium text-indigo-600">Print</button>
      </div>
    </div>
  );
}
