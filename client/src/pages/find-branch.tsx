import Navbar from "@/components/ui/navbar";
import BranchFinder from "@/components/ui/branch-finder";

export default function FindBranch() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showLogin={true} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find a Branch or ATM</h1>
          <p className="text-gray-600 text-lg">
            Locate the nearest Finora branch or ATM to you. Get directions, hours, and available services.
          </p>
        </div>
        
        <BranchFinder />
        
        {/* Additional Information */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Banking Services</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                Personal and business account opening
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                Loan consultations and applications
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                Investment and wealth management
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                Mortgage and home equity services
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                Safe deposit boxes
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">ATM Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                24/7 access to your accounts
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                Cash withdrawals and deposits
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                Check deposits
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                Balance inquiries and transfers
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-finora-primary mr-3"></i>
                Multilingual support
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}