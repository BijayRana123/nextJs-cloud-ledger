"use client"; // Add client directive for hooks
import { useState } from 'react'; // Import useState
import { useRouter } from 'next/navigation'; // Import useRouter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import Button
import { Label } from "@/components/ui/label"; // Import Label
import { Input } from "@/components/ui/input"; // Import Input
import Cookies from 'js-cookie'; // Import Cookies library


// Placeholder components for each step
function Step1({ onNext, businessName, setBusinessName, displayName, setDisplayName, workspaceName, setWorkspaceName }) {
  const handleNextClick = () => {
    // Basic validation for Step 1 (can be expanded)
    if (!businessName || !displayName || !workspaceName) {
      alert("Please fill in all required fields for Step 1.");
      return;
    }
    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 1 of 4: Add New Organization</h2>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="business-name">Your registered business name</Label>
          <Input
            id="business-name"
            placeholder="Company Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="display-name">Name to display across the app</Label>
          <Input
            id="display-name"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="workspace-name">Workspace name for your organization. This may change as per availability</Label>
          <div className="flex">
            <Input
              id="workspace-name"
              placeholder="your-organization.tigg.app"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="rounded-r-none"
              required
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 bg-gray-50 text-gray-500 text-sm">
              .tigg.app
            </span>
          </div>
        </div>
      </div>
      <Button onClick={handleNextClick} className="w-full mt-6">Next: Accounting Details</Button>
    </div>
  );
}

function Step2({ onBack, onNext, panNumber, setPanNumber, startDate, setStartDate, registeredAddress, setRegisteredAddress, registeredWithVAT, setRegisteredWithVAT }) {
  const handleNextClick = () => {
    // Basic validation for Step 2 (can be expanded)
    if (!panNumber || !startDate || !registeredAddress) {
      alert("Please fill in all required fields for Step 2.");
      return;
    }
    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 2 of 4: Accounting Details</h2>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="pan-number">Your business PAN Number</Label>
          <Input
            id="pan-number"
            placeholder="Your business PAN Number"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="start-date">Your Accounting Start Date</Label>
          <Input
            id="start-date"
            placeholder="Select date"
            type="date" // Use type="date" for a basic date picker
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="registered-address">The registered address of your business.</Label>
          <Input // Using Input for simplicity, could be textarea
            id="registered-address"
            placeholder="Registered Address"
            value={registeredAddress}
            onChange={(e) => setRegisteredAddress(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="registered-with-vat"
            checked={registeredWithVAT}
            onChange={(e) => setRegisteredWithVAT(e.target.checked)}
          />
          <Label htmlFor="registered-with-vat">Registered with VAT</Label>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <Button onClick={handleNextClick}>Next: Company Profile</Button>
        <Button onClick={onBack} variant="outline">Back</Button>
      </div>
    </div>
  );
}

function Step3({ onBack, onNext, phoneNumber, setPhoneNumber, orgEmail, setOrgEmail, website, setWebsite, agreeTerms, setAgreeTerms, agreePrivacy, setAgreePrivacy }) {
  const handleNextClick = () => {
    // Basic validation for Step 3 (can be expanded)
    if (!phoneNumber || !orgEmail || !website || !agreeTerms || !agreePrivacy) {
      alert("Please fill in all required fields and agree to the terms for Step 3.");
      return;
    }
    onNext();
  };

  const handleAgreePrivacyChange = (e) => {
    setAgreePrivacy(e.target.checked);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 3 of 4: Organization Details</h2>
      <div className="grid grid-cols-2 gap-4"> {/* Use grid for two columns */}
        <div className="flex flex-col space-y-1.5 col-span-1"> {/* Left column */}
          <Label htmlFor="phone-number">Your registered phone number</Label>
          <Input
            id="phone-number"
            placeholder="Phone Number"
            type="tel" // Use type="tel" for phone number
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <Label htmlFor="org-email">Your organization's email address</Label>
          <Input
            id="org-email"
            placeholder="Email Address"
            type="email" // Use type="email" for email
            value={orgEmail}
            onChange={(e) => setOrgEmail(e.target.value)}
            required
          />
          <Label htmlFor="website">Your organization's website</Label>
          <Input
            id="website"
            placeholder="Website"
            type="url" // Use type="url" for website
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col items-center justify-center col-span-1"> {/* Right column for logo */}
          <div className="w-32 h-32 border border-dashed flex items-center justify-center text-gray-500">
            {/* Placeholder for logo upload */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 002.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 mt-2">Image size should be minimum 300px by 300px</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 mt-4">
        <input
          type="checkbox"
          id="agree-terms"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          required
        />
        <Label htmlFor="agree-terms">I agree to the Terms of Service</Label>
      </div>
      <div className="flex items-center space-x-2 mt-2">
        <input
          type="checkbox"
          id="agree-privacy"
          checked={agreePrivacy}
          onChange={handleAgreePrivacyChange} // Use the new handler function
          required
        />
        <Label htmlFor="agree-privacy">I agree to the Privacy Policy</Label>
      </div>
      <div className="flex justify-between mt-6">
        <Button onClick={handleNextClick}>Next: Referral Code</Button>
        <Button onClick={onBack} variant="outline">Back</Button>
      </div>
    </div>
  );
}

function Step4({ onBack, onSubmit, referralCode, setReferralCode, loading }) {
  const handleSubmitClick = () => {
    // Simulate submission with referral code

    onSubmit(referralCode); // Call the parent onSubmit with referral code
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 4 of 4: Referral Code</h2>
      <p className="text-gray-600 mb-4">Got a Referral Code? Enter it here. Using a referral code allows us to track how you discovered us and may unlock exclusive benefits or discounts. If you don't have a code, feel free to leave this field blank and continue with your signup.</p>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="referral-code">Referral Code</Label>
          <Input
            id="referral-code"
            placeholder="Referral Code"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <Button onClick={onBack} variant="outline" disabled={loading}>Back</Button>
        <Button onClick={handleSubmitClick} disabled={loading}>
          {loading ? 'Submitting...' : 'Send Request'}
        </Button>
      </div>
    </div>
  );
}

function SubmissionSuccess() {
  const router = useRouter(); // Initialize useRouter

  const handleGoToDashboard = () => {
    // Redirect to the dashboard page
    router.push('/dashboard');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your request has been submitted</h2>
      {/* Success message content */}
      <p>Your request has been submitted successfully.</p>
      {/* Go to Profile button */}
      <Button onClick={handleGoToDashboard} className="mt-6">Go to your Profile</Button>
    </div>
  );
}


export default function OrgSetupPage() {
  const router = useRouter(); // Call useRouter at the top level

  const [currentStep, setCurrentStep] = useState(1);
  // State for all form fields
  const [businessName, setBusinessName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [registeredWithVAT, setRegisteredWithVAT] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(null); // Add error state

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => { // Make handleSubmit async

    setError(null); // Clear previous errors
    setLoading(true); // Set loading to true

    // Collect all data
    const organizationData = {
      organizationName: businessName, // Add organizationName using businessName
      businessName,
      displayName,
      workspaceName,
      panNumber,
      startDate,
      registeredAddress,
      registeredWithVAT,
      phoneNumber,
      orgEmail,
      website,
      referralCode,
    };



    try {
      // Call the backend API to create and link the organization
      // The browser will automatically include the HTTP-only cookie
      const response = await fetch('/api/user/setup-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Do NOT manually include the Authorization header for HTTP-only cookies
        },
        body: JSON.stringify(organizationData),
      });

      const data = await response.json();

      if (response.ok) {

        // Store the new organization ID in local storage
        if (data.organizationId) { // Assuming the API returns the new organization ID as 'organizationId'
          // Clear any existing organization IDs first
          localStorage.removeItem('currentOrganizationId');
          localStorage.removeItem('organizationId');
          
          // Store the new organization ID
          localStorage.setItem('currentOrganizationId', data.organizationId);
        }
        setCurrentStep(5); // Move to success step
      } else {
        setError(data.message || 'Organization setup failed');
        console.error("Organization setup failed:", data);
      }
    } catch (error) {
      setError('An error occurred during organization setup');
      console.error("Organization setup error:", error);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 onNext={handleNext} businessName={businessName} setBusinessName={setBusinessName} displayName={displayName} setDisplayName={setDisplayName} workspaceName={workspaceName} setWorkspaceName={setWorkspaceName} />;
      case 2:
        return <Step2 onBack={handleBack} onNext={handleNext} panNumber={panNumber} setPanNumber={setPanNumber} startDate={startDate} setStartDate={setStartDate} registeredAddress={registeredAddress} setRegisteredAddress={setRegisteredAddress} registeredWithVAT={registeredWithVAT} setRegisteredWithVAT={setRegisteredWithVAT} />;
      case 3:
        return <Step3 onBack={handleBack} onNext={handleNext} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} orgEmail={orgEmail} setOrgEmail={setOrgEmail} website={website} setWebsite={setWebsite} agreeTerms={agreeTerms} setAgreeTerms={setAgreeTerms} agreePrivacy={agreePrivacy} setAgreePrivacy={setAgreePrivacy} />;
      case 4:
        return <Step4 onBack={handleBack} onSubmit={handleSubmit} referralCode={referralCode} setReferralCode={setReferralCode} loading={loading} />;
      case 5:
        return <SubmissionSuccess />;
      default:
        return <Step1 onNext={handleNext} businessName={businessName} setBusinessName={setBusinessName} displayName={displayName} setDisplayName={setDisplayName} workspaceName={workspaceName} setWorkspaceName={setWorkspaceName} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Organization Setup Wizard</CardTitle>
          <CardDescription>Step {currentStep} of 4</CardDescription> {/* Update description */}
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>} {/* Display error message */}
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}
