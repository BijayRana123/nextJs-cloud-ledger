import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const EmailModal = ({ isOpen, onClose, to: toProp = '', subject: subjectProp = '', body: bodyProp = '', pdfPreviewUrl, pdfFileName, orderId, type = 'sales-voucher', onEmailSent }) => {
  const [to, setTo] = useState(toProp);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [replyTo, setReplyTo] = useState('demo@app.com');
  const [subject, setSubject] = useState(subjectProp);
  const [body, setBody] = useState(bodyProp);

  React.useEffect(() => {
    setTo(toProp);
    setSubject(subjectProp);
    setBody(bodyProp);
  }, [toProp, subjectProp, bodyProp]);

  const handleSendEmail = async () => {
    setIsSending(true);
    setSendError(null);
    try {
      // Use the correct endpoint based on the type
      let endpoint = '';
      if (type === 'sales-voucher') {
        endpoint = `/api/organization/sales-vouchers/${orderId}/send-email`;
      } else if (type === 'purchase-order') {
        endpoint = `/api/organization/purchase-orders/${orderId}/send-email`;
      } else if (type === 'sales-return-voucher') {
        endpoint = `/api/organization/sales-return-vouchers/${orderId}/send-email`;
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: to,
          replyTo: replyTo,
          subject: subject,
          body: body,
          pdfBase64: pdfPreviewUrl, // send the base64 PDF string
          pdfFileName: pdfFileName,
        }),
      });
      if (response.ok) {
        onClose();
        if (onEmailSent) onEmailSent();
      } else {
        const errorData = await response.json();
        setSendError(errorData.message || 'Failed to send email.');
      }
    } catch (error) {
      setSendError('An error occurred while sending the email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Send Sales Voucher Email</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="to" className="text-right">
                To: <span className="text-red-500">*</span>
              </Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="replyTo" className="text-right">
                Reply To: <span className="text-red-500">*</span>
              </Label>
              <Input
                id="replyTo"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject: <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="body" className="text-right">
                Body:
              </Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="col-span-3 border rounded-md p-2 min-h-[120px]"
              />
            </div>
            {/* PDF Preview Section */}
            {pdfPreviewUrl && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right">PDF Preview:</Label>
                <div className="col-span-3">
                  <iframe
                    src={pdfPreviewUrl}
                    title="PDF Preview"
                    className="w-full h-64 border rounded"
                  />
                  <a
                    href={pdfPreviewUrl}
                    download={pdfFileName}
                    className="text-blue-600 underline mt-2 inline-block"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        {sendError && <div className="text-red-500 text-sm mt-2">{sendError}</div>}
        <div className="flex justify-end sticky bottom-0 bg-white pt-4 pb-2 z-10">
          <Button onClick={handleSendEmail} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailModal;
