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

const EmailModal = ({ isOpen, onClose, purchaseOrderId, onEmailSent }) => {
  const [to, setTo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [replyTo, setReplyTo] = useState('demo@tiggapp.com'); // Default value from image
  const [subject, setSubject] = useState('Purchase Order from Tigg Bookkeeping Services'); // Default value from image
  const [body, setBody] = useState(`Hello ABC Associates Pvt Ltd,

Please find the attached Purchase Order DRAFT for the requested items. The document includes all relevant details, such as quantities, prices, and other instructions.

Kindly confirm receipt of this order and share an estimated delivery timeline at your earliest convenience.

If you have any questions or need further clarification, please don't hesitate to contact us at or reply to this email.
`); // Default value from image

  const handleSendEmail = async () => {
    setIsSending(true);
    setSendError(null);

    // Placeholder for actual email sending API call
    try {
      // Call the actual API endpoint to send the email
      const response = await fetch(`/api/organization/purchase-orders/${purchaseOrderId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: to,
          replyTo: replyTo,
          subject: subject,
          body: body,
          // Add other necessary data like attachments if implemented
        }),
      });

      if (response.ok) {
        console.log('Email sent successfully');
        onClose(); // Close modal on success
        if (onEmailSent) {
          onEmailSent(); // Call callback for redirection
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to send email:', errorData);
        setSendError(errorData.message || 'Failed to send email.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendError('An error occurred while sending the email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Email</DialogTitle>
        </DialogHeader>
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
              className="col-span-3 border rounded-md p-2 min-h-[150px]"
            />
          </div>
           {/* Add file attachment section later if needed */}
           {/* <div className="grid grid-cols-4 items-center gap-4">
             <div className="col-start-2 col-span-3">
               <div className="flex items-center space-x-2">
                 <input type="checkbox" id="attach-pdf" checked readOnly />
                 <label htmlFor="attach-pdf" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                   Attach PurchaseOrder PDF
                 </label>
               </div>
             </div>
           </div>
           <div className="grid grid-cols-4 items-center gap-4">
             <div className="col-start-2 col-span-3 border-2 border-dashed rounded-md p-4 text-center">
               Drag and drop or click here to upload files
             </div>
           </div> */}
        </div>
        {sendError && <div className="text-red-500 text-sm mt-2">{sendError}</div>}
        <div className="flex justify-end">
          <Button onClick={handleSendEmail} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailModal;
