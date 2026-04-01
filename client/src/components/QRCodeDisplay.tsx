import { useState, useRef } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  respondentName?: string;
  respondentEmail?: string;
}

export function QRCodeDisplay({ url, respondentName, respondentEmail }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `qr-code-${respondentName || 'respondent'}.png`;
      link.click();
    }
  };

  const handleCopyQRImage = async () => {
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        });
      } catch (err) {
        console.error('Erro ao copiar QR code:', err);
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center gap-3">
      <div className="text-xs font-semibold text-slate-600 text-center">
        QR Code para Acesso Rápido
      </div>
      
      {/* QR Code */}
      <div 
        ref={qrRef}
        className="bg-white p-2 rounded border border-slate-300"
      >
        <QRCode
          value={url}
          size={150}
          level="H"
          includeMargin={true}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>

      {/* Informações do Respondente */}
      {(respondentName || respondentEmail) && (
        <div className="text-xs text-slate-600 text-center max-w-xs">
          {respondentName && <p className="font-semibold">{respondentName}</p>}
          {respondentEmail && <p className="text-slate-500">{respondentEmail}</p>}
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-2 w-full">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={handleDownloadQR}
          title="Baixar QR code como imagem"
        >
          <Download className="w-3 h-3 mr-1" />
          Baixar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={handleCopyQRImage}
          title="Copiar QR code para clipboard"
        >
          {copied ? (
            <Check className="w-3 h-3 mr-1 text-green-600" />
          ) : (
            <Copy className="w-3 h-3 mr-1" />
          )}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>

      {/* Instruções */}
      <div className="text-xs text-slate-500 text-center bg-slate-50 p-2 rounded w-full">
        <p>Compartilhe este QR code via:</p>
        <p className="text-slate-400">WhatsApp • Email • SMS • Impressão</p>
      </div>
    </div>
  );
}
